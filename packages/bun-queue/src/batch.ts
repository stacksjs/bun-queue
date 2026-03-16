import type { RedisClient } from 'bun'
import type { Queue } from './queue'
import type { Batch, BatchOptions, Job } from './types'
import { createLogger } from './logger'
import { generateId, mergeOptions } from './utils'

export class BatchProcessor<T = any> {
  private readonly queue: Queue<T>
  private readonly redisClient: RedisClient
  private readonly keyPrefix: string
  private readonly logger = createLogger()

  constructor(queue: Queue<T>) {
    this.queue = queue
    this.redisClient = queue.redisClient
    this.keyPrefix = queue.keyPrefix
  }

  /**
   * Create a new batch of jobs
   */
  async createBatch(jobs: T[], options?: BatchOptions): Promise<Batch<T>> {
    const batchId = generateId()
    const timestamp = Date.now()
    const opts = mergeOptions(options) as BatchOptions

    // Add all jobs to the queue first
    const jobIds: string[] = []

    for (const jobData of jobs) {
      const job = await this.queue.add(jobData, {
        ...opts,
        // Don't process these jobs through normal queue
        // They'll be processed as part of the batch
        delay: opts.delay || 0,
      })

      jobIds.push(job.id)
    }

    // Store batch metadata and job associations atomically
    const batchKey = this.getBatchKey(batchId)
    const batchJobsKey = this.getBatchJobsKey(batchId)
    const lua = `
      redis.call('HMSET', KEYS[1], 'id', ARGV[1], 'timestamp', ARGV[2], 'status', 'waiting', 'opts', ARGV[3])
      for i = 4, #ARGV do
        redis.call('SADD', KEYS[2], ARGV[i])
      end
      return 1
    `
    await this.redisClient.send('EVAL', [
      lua, '2', batchKey, batchJobsKey,
      batchId, timestamp.toString(), JSON.stringify(opts), ...jobIds,
    ])

    // Emit batch added event
    this.queue.events.emit('batchAdded', batchId, jobIds)

    // Return the batch
    return {
      id: batchId,
      jobs: await this.getBatchJobs(batchId),
      opts,
      timestamp,
      status: 'waiting',
    }
  }

  /**
   * Process a batch of jobs
   */
  async processBatch<R = any>(batchId: string, handler: (jobs: Job<T>[]) => Promise<R[]>): Promise<R[]> {
    // Get batch info
    const batchKey = this.getBatchKey(batchId)
    const exists = await this.redisClient.exists(batchKey)

    if (!exists) {
      throw new Error(`Batch ${batchId} not found`)
    }

    // Update batch status to active
    await this.redisClient.send('HSET', [
      batchKey,
      'status',
      'active',
      'processingAt',
      Date.now().toString(),
    ])

    try {
      // Get all jobs in the batch
      const jobs = await this.getBatchJobs(batchId)

      if (jobs.length === 0) {
        this.logger.warn(`Batch ${batchId} has no jobs`)
        return []
      }

      // Process the batch
      this.logger.debug(`Processing batch ${batchId} with ${jobs.length} jobs`)

      // Call the handler with all jobs
      const results = await handler(jobs)

      // Mark batch as completed
      await this.redisClient.send('HSET', [
        batchKey,
        'status',
        'completed',
        'finishedAt',
        Date.now().toString(),
      ])

      // Emit batch completed event
      this.queue.events.emit('batchCompleted', batchId, results)

      return results
    }
    catch (error) {
      // Mark batch as failed
      await this.redisClient.send('HSET', [
        batchKey,
        'status',
        'failed',
        'finishedAt',
        Date.now().toString(),
        'error',
        (error as Error).message,
      ])

      // Emit batch failed event
      this.queue.events.emit('batchFailed', batchId, [error as Error])

      throw error
    }
  }

  /**
   * Get all jobs associated with a batch
   */
  async getBatchJobs(batchId: string): Promise<Job<T>[]> {
    const jobIds = await this.redisClient.smembers(this.getBatchJobsKey(batchId))
    const jobs: Job<T>[] = []

    for (const jobId of jobIds) {
      const job = await this.queue.getJob(jobId)
      if (job) {
        jobs.push(job)
      }
    }

    return jobs
  }

  /**
   * Get batch by id
   */
  async getBatch(batchId: string): Promise<Batch<T> | null> {
    const batchKey = this.getBatchKey(batchId)
    const exists = await this.redisClient.exists(batchKey)

    if (!exists) {
      return null
    }

    const rawBatchData = await this.redisClient.hgetall(batchKey)

    if (!rawBatchData) {
      return null
    }

    // Handle both array format (ioredis send) and object format (Bun/ioredis hgetall)
    let batchData: Record<string, string>
    if (Array.isArray(rawBatchData)) {
      batchData = {}
      for (let i = 0; i < rawBatchData.length; i += 2) {
        batchData[rawBatchData[i] as string] = rawBatchData[i + 1] as string
      }
    }
    else {
      batchData = rawBatchData as Record<string, string>
    }

    return {
      id: batchId,
      jobs: await this.getBatchJobs(batchId),
      opts: JSON.parse(batchData.opts || '{}'),
      timestamp: Number.parseInt(batchData.timestamp || '0'),
      status: batchData.status as any,
      processingAt: batchData.processingAt ? Number.parseInt(batchData.processingAt) : undefined,
      finishedAt: batchData.finishedAt ? Number.parseInt(batchData.finishedAt) : undefined,
    }
  }

  /**
   * Set batch progress
   */
  async setBatchProgress(batchId: string, progress: number): Promise<void> {
    await this.redisClient.send('HSET', [
      this.getBatchKey(batchId),
      'progress',
      progress.toString(),
    ])
    this.queue.events.emit('batchProgress', batchId, progress)
  }

  /**
   * Remove a batch and all its jobs
   */
  async removeBatch(batchId: string): Promise<void> {
    const jobs = await this.getBatchJobs(batchId)

    // Remove all jobs first
    for (const job of jobs) {
      await this.queue.removeJob(job.id)
    }

    // Remove batch data atomically
    const lua = `
      redis.call('DEL', KEYS[1])
      redis.call('DEL', KEYS[2])
      return 1
    `
    await this.redisClient.send('EVAL', [
      lua, '2', this.getBatchKey(batchId), this.getBatchJobsKey(batchId),
    ])
  }

  private getBatchKey(batchId: string): string {
    return `${this.keyPrefix}:batch:${batchId}`
  }

  private getBatchJobsKey(batchId: string): string {
    return `${this.keyPrefix}:batch:${batchId}:jobs`
  }
}
