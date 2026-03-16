import type { Queue } from './queue'
import type { JobOptions } from './types'
import { parseJob } from './utils'

export class Job<T = any> {
  queue: Queue<T>
  id: string
  data: T
  name: string
  opts: JobOptions
  progress: number
  delay: number
  timestamp: number
  attemptsMade: number
  stacktrace: string[]
  returnvalue: any
  finishedOn?: number
  processedOn?: number
  failedReason?: string
  dependencies?: string[]

  constructor(queue: Queue<T>, jobId: string) {
    this.queue = queue
    this.id = jobId
    this.data = {} as T
    this.name = ''
    this.opts = {}
    this.progress = 0
    this.delay = 0
    this.timestamp = 0
    this.attemptsMade = 0
    this.stacktrace = []
    this.returnvalue = null
    this.dependencies = []
  }

  /**
   * Refresh job data from Redis
   */
  async refresh(): Promise<void> {
    const jobKey = this.queue.getJobKey(this.id)
    const jobData = await this.queue.redisClient.send('HGETALL', [jobKey])

    if (!jobData || (Array.isArray(jobData) && jobData.length === 0) || (typeof jobData === 'object' && Object.keys(jobData).length === 0)) {
      throw new Error(`Job ${this.id} not found`)
    }

    // Bun's RedisClient returns an object, ioredis returns a flat array
    let jobObj: Record<string, string>
    if (Array.isArray(jobData)) {
      jobObj = {}
      for (let i = 0; i < jobData.length; i += 2) {
        jobObj[jobData[i] as string] = jobData[i + 1] as string
      }
    }
    else {
      jobObj = jobData as Record<string, string>
    }

    const parsed = parseJob(jobObj)

    this.data = parsed.data
    this.name = parsed.name
    this.opts = parsed.opts
    this.progress = parsed.progress
    this.delay = parsed.delay
    this.timestamp = parsed.timestamp
    this.attemptsMade = parsed.attemptsMade
    this.stacktrace = parsed.stacktrace
    this.returnvalue = parsed.returnvalue
    this.finishedOn = parsed.finishedOn
    this.processedOn = parsed.processedOn
    this.failedReason = parsed.failedReason
    this.dependencies = parsed.dependencies || []
  }

  /**
   * Update job progress
   */
  async updateProgress(progress: number): Promise<void> {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100')
    }

    this.progress = progress

    const jobKey = this.queue.getJobKey(this.id)
    await this.queue.redisClient.send('HSET', [jobKey, 'progress', progress.toString()])

    // Emit progress event
    if (this.queue.events) {
      this.queue.events.emitJobProgress(this.id, progress)
    }
  }

  /**
   * Move job to completed
   */
  async moveToCompleted(returnvalue: any = null): Promise<void> {
    const jobKey = this.queue.getJobKey(this.id)
    const now = Date.now()

    // Use Lua for atomicity without MULTI (avoids nested MULTI on shared connection)
    const lua = `
      redis.call('LREM', KEYS[1], 0, ARGV[1])
      redis.call('LPUSH', KEYS[2], ARGV[1])
      redis.call('HMSET', KEYS[3], 'finishedOn', ARGV[2], 'returnvalue', ARGV[3])
      return 1
    `
    await this.queue.redisClient.send('EVAL', [
      lua, '3',
      this.queue.getKey('active'),
      this.queue.getKey('completed'),
      jobKey,
      this.id,
      now.toString(),
      JSON.stringify(returnvalue),
    ])

    this.finishedOn = now
    this.returnvalue = returnvalue

    // Emit completion event
    if (this.queue.events) {
      this.queue.events.emitJobCompleted(this.id, returnvalue)
    }

    // Update any dependent jobs - move them to waiting if all dependencies are met
    await this.processDependents()
  }

  /**
   * Move job to failed
   */
  async moveToFailed(err: Error, failedReason?: string): Promise<void> {
    const jobKey = this.queue.getJobKey(this.id)

    // Update stacktrace
    const stacktrace = this.stacktrace || []
    stacktrace.push(err.stack || err.message)

    // Trim stacktrace to last 10 items
    if (stacktrace.length > 10) {
      stacktrace.splice(0, stacktrace.length - 10)
    }

    const now = Date.now()

    // Use Lua for atomicity without MULTI (avoids nested MULTI on shared connection)
    const lua = `
      redis.call('LREM', KEYS[1], 0, ARGV[1])
      redis.call('LPUSH', KEYS[2], ARGV[1])
      redis.call('HMSET', KEYS[3], 'finishedOn', ARGV[2], 'failedReason', ARGV[3], 'stacktrace', ARGV[4], 'attemptsMade', ARGV[5])
      return 1
    `
    await this.queue.redisClient.send('EVAL', [
      lua, '3',
      this.queue.getKey('active'),
      this.queue.getKey('failed'),
      jobKey,
      this.id,
      now.toString(),
      failedReason || err.message,
      JSON.stringify(stacktrace),
      (this.attemptsMade + 1).toString(),
    ])

    this.finishedOn = now
    this.failedReason = failedReason || err.message
    this.stacktrace = stacktrace
    this.attemptsMade += 1

    // Emit failure event
    if (this.queue.events) {
      this.queue.events.emitJobFailed(this.id, err)
    }
  }

  /**
   * Retry a failed job
   */
  async retry(): Promise<void> {
    const jobKey = this.queue.getJobKey(this.id)

    // Remove from failed list
    await this.queue.redisClient.send('LREM', [this.queue.getKey('failed'), '0', this.id])

    // Reset job state
    await this.queue.redisClient.send('HMSET', [
      jobKey,
      'finishedOn',
      '',
      'failedReason',
      '',
      'processedOn',
      '',
    ])

    // Add back to waiting list
    await this.queue.redisClient.send('LPUSH', [this.queue.getKey('waiting'), this.id])
  }

  /**
   * Remove the job
   */
  async remove(): Promise<void> {
    await this.queue.removeJob(this.id)
  }

  /**
   * Process dependent jobs after this job completes
   */
  private async processDependents(): Promise<void> {
    const dependentKey = `${this.queue.getJobKey(this.id)}:dependents`
    const dependents = await this.queue.redisClient.send('SMEMBERS', [dependentKey])

    if (!dependents || dependents.length === 0) {
      return
    }

    // Check each dependent job
    for (const depJobId of dependents) {
      // Check if all dependencies of this dependent job are completed
      const depJob = await this.queue.getJob(depJobId as string)
      if (!depJob || !depJob.dependencies) {
        continue
      }

      // Check if all dependencies are completed
      let allDependenciesCompleted = true
      for (const dependency of depJob.dependencies) {
        const depJob = await this.queue.getJob(dependency)
        if (depJob && !depJob.finishedOn) {
          allDependenciesCompleted = false
          break
        }
      }

      if (allDependenciesCompleted) {
        // All dependencies are now completed, move to waiting
        await this.queue.redisClient.send('SREM', [this.queue.getKey('dependency-wait'), depJobId])
        await this.queue.redisClient.send('LPUSH', [this.queue.getKey('waiting'), depJobId])
      }
    }
  }
}
