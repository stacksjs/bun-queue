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

    if (!jobData || !Array.isArray(jobData) || jobData.length === 0) {
      throw new Error(`Job ${this.id} not found`)
    }

    // Convert array to object
    const jobObj: Record<string, string> = {}
    for (let i = 0; i < jobData.length; i += 2) {
      jobObj[jobData[i]] = jobData[i + 1]
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
    const multi = this.queue.redisClient.send('MULTI', [])

    // Remove from active
    this.queue.redisClient.send('LREM', [this.queue.getKey('active'), '0', this.id])

    // Add to completed
    this.queue.redisClient.send('LPUSH', [this.queue.getKey('completed'), this.id])

    // Update job data
    const now = Date.now()
    this.queue.redisClient.send('HMSET', [
      jobKey,
      'finishedOn',
      now.toString(),
      'returnvalue',
      JSON.stringify(returnvalue),
    ])

    await this.queue.redisClient.send('EXEC', [])

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
    const multi = this.queue.redisClient.send('MULTI', [])

    // Remove from active
    this.queue.redisClient.send('LREM', [this.queue.getKey('active'), '0', this.id])

    // Add to failed
    this.queue.redisClient.send('LPUSH', [this.queue.getKey('failed'), this.id])

    // Update stacktrace
    const stacktrace = this.stacktrace || []
    stacktrace.push(err.stack || err.message)

    // Trim stacktrace to last 10 items
    if (stacktrace.length > 10) {
      stacktrace.splice(0, stacktrace.length - 10)
    }

    // Update job data
    const now = Date.now()
    this.queue.redisClient.send('HMSET', [
      jobKey,
      'finishedOn',
      now.toString(),
      'failedReason',
      failedReason || err.message,
      'stacktrace',
      JSON.stringify(stacktrace),
      'attemptsMade',
      (this.attemptsMade + 1).toString(),
    ])

    await this.queue.redisClient.send('EXEC', [])

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
