import type { RedisClient } from 'bun'
import type { JobOptions, JobStatus, QueueConfig } from './types'
import { scriptLoader } from './commands'
import { config } from './config'
import { Job } from './job'
import { generateId, getRedisClient, mergeOptions } from './utils'
import { Worker } from './worker'

export class Queue<T = any> {
  name: string
  prefix: string
  redisClient: RedisClient
  keyPrefix: string
  private worker: Worker<T> | null = null

  constructor(name: string, options?: QueueConfig) {
    this.name = name
    this.prefix = options?.prefix || config.prefix || 'queue'
    this.redisClient = getRedisClient(options)
    this.keyPrefix = `${this.prefix}:${this.name}`

    // Initialize scripts
    this.init()
  }

  /**
   * Initialize the queue by loading scripts
   */
  private async init(): Promise<void> {
    await scriptLoader.load(this.redisClient, 'src/commands')
  }

  /**
   * Add a job to the queue
   */
  async add(data: T, options?: JobOptions): Promise<Job<T>> {
    const opts = mergeOptions(options)
    const jobId = opts.jobId || generateId()
    const timestamp = Date.now()

    // Store the job
    const jobKey = this.getJobKey(jobId)

    await this.redisClient.send('HMSET', [
      jobKey,
      'id',
      jobId,
      'name',
      this.name,
      'data',
      JSON.stringify(data),
      'timestamp',
      timestamp.toString(),
      'delay',
      (opts.delay || 0).toString(),
      'opts',
      JSON.stringify(opts),
      'attemptsMade',
      '0',
      'progress',
      '0',
    ])

    if (opts.delay && opts.delay > 0) {
      // Add to delayed set
      const processAt = timestamp + opts.delay
      await this.redisClient.send('ZADD', [
        this.getKey('delayed'),
        processAt.toString(),
        jobId,
      ])
    }
    else {
      // Add to waiting list
      const pushCmd = opts.lifo ? 'RPUSH' : 'LPUSH'
      await this.redisClient.send(pushCmd, [this.getKey('waiting'), jobId])
    }

    const job = new Job<T>(this, jobId)
    await job.refresh()
    return job
  }

  /**
   * Get a job by id
   */
  async getJob(jobId: string): Promise<Job<T> | null> {
    const jobKey = this.getJobKey(jobId)
    const exists = await this.redisClient.exists(jobKey)

    if (!exists) {
      return null
    }

    const job = new Job<T>(this, jobId)
    await job.refresh()
    return job
  }

  /**
   * Process jobs with a handler function
   */
  process(concurrency: number, handler: (job: Job<T>) => Promise<any>): void {
    this.worker = new Worker<T>(this, concurrency, handler)
    this.worker.start()
  }

  /**
   * Stop processing jobs
   */
  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.stop()
    }

    this.redisClient.close()
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    await this.redisClient.set(this.getKey('paused'), '1')
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.redisClient.del(this.getKey('paused'))
  }

  /**
   * Remove a job from the queue
   */
  async removeJob(jobId: string): Promise<void> {
    const jobKey = this.getJobKey(jobId)

    // Remove from all possible lists
    const statusLists = ['active', 'waiting', 'completed', 'failed']
    for (const list of statusLists) {
      await this.redisClient.send('LREM', [this.getKey(list), '0', jobId])
    }

    // Remove from delayed set
    await this.redisClient.send('ZREM', [this.getKey('delayed'), jobId])

    // Remove the job hash
    await this.redisClient.del(jobKey)
  }

  /**
   * Get jobs by status
   */
  async getJobs(status: JobStatus, start = 0, end = -1): Promise<Job<T>[]> {
    let jobIds: string[] = []

    if (status === 'delayed') {
      const jobs = await this.redisClient.send('ZRANGE', [
        this.getKey(status),
        start.toString(),
        end.toString(),
      ])
      jobIds = jobs as string[]
    }
    else {
      const jobs = await this.redisClient.send('LRANGE', [
        this.getKey(status),
        start.toString(),
        end.toString(),
      ])
      jobIds = jobs as string[]
    }

    const result: Job<T>[] = []

    for (const jobId of jobIds) {
      const job = await this.getJob(jobId)
      if (job) {
        result.push(job)
      }
    }

    return result
  }

  /**
   * Get job counts
   */
  async getJobCounts(): Promise<Record<JobStatus, number>> {
    const statuses: JobStatus[] = ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused']
    const counts: Record<JobStatus, number> = {} as Record<JobStatus, number>

    for (const status of statuses) {
      let count = 0
      if (status === 'delayed') {
        count = await this.redisClient.send('ZCARD', [this.getKey(status)]) as number
      }
      else if (status === 'paused') {
        const exists = await this.redisClient.exists(this.getKey(status))
        count = exists ? 1 : 0
      }
      else {
        count = await this.redisClient.send('LLEN', [this.getKey(status)]) as number
      }
      counts[status] = count
    }

    return counts
  }

  /**
   * Clear all jobs from the queue
   */
  async empty(): Promise<void> {
    const keys = await this.redisClient.keys(`${this.keyPrefix}:*`)

    if (keys.length) {
      await this.redisClient.del(...keys)
    }
  }

  /**
   * Convert key name to prefixed key
   */
  getKey(name: string): string {
    return `${this.keyPrefix}:${name}`
  }

  /**
   * Get the job key
   */
  getJobKey(jobId: string): string {
    return `${this.keyPrefix}:job:${jobId}`
  }
}
