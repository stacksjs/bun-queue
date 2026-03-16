import type { Queue } from './queue'
import type { DeadLetterQueueOptions } from './types'
import { Job } from './job'
import { createLogger } from './logger'

export class DeadLetterQueue<T = any> {
  private queue: Queue<T>
  private deadLetterQueueName: string
  private options: DeadLetterQueueOptions
  private logger = createLogger('dead-letter-queue')

  constructor(queue: Queue<T>, options: DeadLetterQueueOptions = {}) {
    this.queue = queue
    this.options = {
      queueSuffix: options.queueSuffix || '-dead-letter',
      maxRetries: options.maxRetries || 3,
      processFailed: options.processFailed || false,
      removeFromOriginalQueue: options.removeFromOriginalQueue !== false,
    }
    this.deadLetterQueueName = `${queue.name}${this.options.queueSuffix}`
    this.logger.debug(`Dead letter queue initialized for queue ${queue.name}`)
  }

  /**
   * Get the name of the dead letter queue
   */
  getQueueName(): string {
    return this.deadLetterQueueName
  }

  /**
   * Move a job to the dead letter queue
   */
  async moveToDeadLetter(job: Job<T>, reason: string): Promise<string> {
    const deadLetterQueueKey = `${this.queue.prefix}:${this.deadLetterQueueName}`
    const deadLetterKey = `${deadLetterQueueKey}:${job.id}`

    try {
      // Move to dead letter queue atomically using Lua
      const failedKey = this.queue.getKey('failed')
      const removeFromOriginal = this.options.removeFromOriginalQueue ? '1' : '0'
      const lua = `
        redis.call('HMSET', KEYS[1], 'id', ARGV[1], 'originalQueue', ARGV[2], 'data', ARGV[3],
          'failedReason', ARGV[4], 'attemptsMade', ARGV[5], 'stacktrace', ARGV[6],
          'timestamp', ARGV[7], 'originalTimestamp', ARGV[8])
        redis.call('LPUSH', KEYS[2], ARGV[1])
        if ARGV[9] == '1' then
          redis.call('LREM', KEYS[3], 0, ARGV[1])
        end
        return 1
      `
      await this.queue.redisClient.send('EVAL', [
        lua, '3', deadLetterKey, deadLetterQueueKey, failedKey,
        job.id, job.name, JSON.stringify(job.data),
        reason || job.failedReason || '', job.attemptsMade.toString(),
        JSON.stringify(job.stacktrace || []), Date.now().toString(),
        job.timestamp.toString(), removeFromOriginal,
      ])

      this.logger.info(`Job ${job.id} moved to dead letter queue ${this.deadLetterQueueName}`)

      // Emit dead letter event
      if (this.queue.events) {
        this.queue.events.emitJobMovedToDeadLetter(job.id, this.deadLetterQueueName, reason)
      }

      return job.id
    }
    catch (err) {
      this.logger.error(`Failed to move job ${job.id} to dead letter queue: ${(err as Error).message}`)
      throw err
    }
  }

  /**
   * Get all jobs in the dead letter queue
   */
  async getJobs(start = 0, end = -1): Promise<Job<T>[]> {
    const deadLetterQueueKey = `${this.queue.prefix}:${this.deadLetterQueueName}`
    const jobIds = await this.queue.redisClient.send('LRANGE', [deadLetterQueueKey, start.toString(), end.toString()])

    if (!jobIds || jobIds.length === 0) {
      return []
    }

    const jobs: Job<T>[] = []
    for (const jobId of jobIds) {
      try {
        const deadLetterKey = `${deadLetterQueueKey}:${jobId}`
        const jobData = await this.queue.redisClient.send('HGETALL', [deadLetterKey])

        if (jobData && ((Array.isArray(jobData) && jobData.length > 0) || (!Array.isArray(jobData) && typeof jobData === 'object' && Object.keys(jobData).length > 0))) {
          // Convert to object - handle both array format (ioredis) and object format (Bun)
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

          // Create job instance
          const job = new Job<T>(this.queue, jobId as string)
          job.data = JSON.parse(jobObj.data || '{}') as T
          job.name = jobObj.originalQueue
          job.timestamp = Number.parseInt(jobObj.timestamp || '0', 10)
          job.attemptsMade = Number.parseInt(jobObj.attemptsMade || '0', 10)
          job.stacktrace = JSON.parse(jobObj.stacktrace || '[]') as string[]
          job.failedReason = jobObj.failedReason

          jobs.push(job)
        }
      }
      catch (err) {
        this.logger.error(`Error fetching job ${jobId} from dead letter queue: ${(err as Error).message}`)
      }
    }

    return jobs
  }

  /**
   * Republish a job from the dead letter queue back to its original queue
   */
  async republishJob(jobId: string, options: { resetRetries?: boolean } = {}): Promise<Job<T> | null> {
    const deadLetterQueueKey = `${this.queue.prefix}:${this.deadLetterQueueName}`
    const deadLetterKey = `${deadLetterQueueKey}:${jobId}`

    try {
      // Get job data from dead letter queue
      const jobData = await this.queue.redisClient.send('HGETALL', [deadLetterKey])

      if (!jobData || (Array.isArray(jobData) && jobData.length === 0) || (!Array.isArray(jobData) && typeof jobData === 'object' && Object.keys(jobData).length === 0)) {
        this.logger.warn(`Job ${jobId} not found in dead letter queue`)
        return null
      }

      // Convert to object - handle both array format (ioredis) and object format (Bun)
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

      // Parse job data
      const data = JSON.parse(jobObj.data || '{}') as T
      const queueName = jobObj.originalQueue

      // Add job back to original queue
      const jobOptions: any = {
        jobId,
      }

      if (options.resetRetries) {
        jobOptions.attempts = 0
      }

      // Add job back to original queue (assuming the queue exists)
      const newJob = await this.queue.add(data, jobOptions)

      // Remove from dead letter queue atomically
      const lua = `
        redis.call('LREM', KEYS[1], 0, ARGV[1])
        redis.call('DEL', KEYS[2])
        return 1
      `
      await this.queue.redisClient.send('EVAL', [
        lua, '2', deadLetterQueueKey, deadLetterKey, jobId,
      ])

      this.logger.info(`Job ${jobId} republished from dead letter queue to ${queueName}`)

      // Emit republish event
      if (this.queue.events) {
        this.queue.events.emitJobRepublishedFromDeadLetter(jobId, queueName)
      }

      return newJob
    }
    catch (err) {
      this.logger.error(`Failed to republish job ${jobId} from dead letter queue: ${(err as Error).message}`)
      throw err
    }
  }

  /**
   * Remove a job from the dead letter queue
   */
  async removeJob(jobId: string): Promise<boolean> {
    const deadLetterQueueKey = `${this.queue.prefix}:${this.deadLetterQueueName}`
    const deadLetterKey = `${deadLetterQueueKey}:${jobId}`

    try {
      const lua = `
        redis.call('LREM', KEYS[1], 0, ARGV[1])
        redis.call('DEL', KEYS[2])
        return 1
      `
      await this.queue.redisClient.send('EVAL', [
        lua, '2', deadLetterQueueKey, deadLetterKey, jobId,
      ])

      this.logger.info(`Job ${jobId} removed from dead letter queue`)
      return true
    }
    catch (err) {
      this.logger.error(`Failed to remove job ${jobId} from dead letter queue: ${(err as Error).message}`)
      return false
    }
  }

  /**
   * Clear the entire dead letter queue
   */
  async clear(): Promise<void> {
    const deadLetterQueueKey = `${this.queue.prefix}:${this.deadLetterQueueName}`

    try {
      // Get all job IDs
      const jobIds = await this.queue.redisClient.send('LRANGE', [deadLetterQueueKey, '0', '-1'])

      if (!jobIds || jobIds.length === 0) {
        return
      }

      // Remove all job keys and the list atomically
      const keys = [deadLetterQueueKey, ...jobIds.map((id: string) => `${deadLetterQueueKey}:${id}`)]
      const lua = `for i = 1, #KEYS do redis.call('DEL', KEYS[i]) end return 1`
      await this.queue.redisClient.send('EVAL', [lua, keys.length.toString(), ...keys])

      this.logger.info(`Dead letter queue ${this.deadLetterQueueName} cleared (${jobIds.length} jobs)`)
    }
    catch (err) {
      this.logger.error(`Failed to clear dead letter queue: ${(err as Error).message}`)
      throw err
    }
  }
}
