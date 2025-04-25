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
      // Begin transaction
      await this.queue.redisClient.send('MULTI', [])

      // Store the job data in the dead letter queue
      await this.queue.redisClient.send('HMSET', [
        deadLetterKey,
        'id',
        job.id,
        'originalQueue',
        job.name,
        'data',
        JSON.stringify(job.data),
        'failedReason',
        reason || job.failedReason || '',
        'attemptsMade',
        job.attemptsMade.toString(),
        'stacktrace',
        JSON.stringify(job.stacktrace || []),
        'timestamp',
        Date.now().toString(),
        'originalTimestamp',
        job.timestamp.toString(),
      ])

      // Add to dead letter list
      await this.queue.redisClient.send('LPUSH', [deadLetterQueueKey, job.id])

      // If configured, remove from failed list
      if (this.options.removeFromOriginalQueue) {
        await this.queue.redisClient.send('LREM', [this.queue.getKey('failed'), '0', job.id])
      }

      // Execute transaction
      await this.queue.redisClient.send('EXEC', [])

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

        if (jobData && Array.isArray(jobData) && jobData.length > 0) {
          // Convert array to object
          const jobObj: Record<string, string> = {}
          for (let i = 0; i < jobData.length; i += 2) {
            jobObj[jobData[i]] = jobData[i + 1]
          }

          // Create job instance
          const job = new Job<T>(this.queue, jobId as string)
          job.data = JSON.parse(jobObj.data || '{}')
          job.name = jobObj.originalQueue
          job.timestamp = Number.parseInt(jobObj.timestamp || '0', 10)
          job.attemptsMade = Number.parseInt(jobObj.attemptsMade || '0', 10)
          job.stacktrace = JSON.parse(jobObj.stacktrace || '[]')
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

      if (!jobData || !Array.isArray(jobData) || jobData.length === 0) {
        this.logger.warn(`Job ${jobId} not found in dead letter queue`)
        return null
      }

      // Convert array to object
      const jobObj: Record<string, string> = {}
      for (let i = 0; i < jobData.length; i += 2) {
        jobObj[jobData[i]] = jobData[i + 1]
      }

      // Parse job data
      const data = JSON.parse(jobObj.data || '{}')
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

      // Remove from dead letter queue
      await this.queue.redisClient.send('MULTI', [])
      await this.queue.redisClient.send('LREM', [deadLetterQueueKey, '0', jobId])
      await this.queue.redisClient.send('DEL', [deadLetterKey])
      await this.queue.redisClient.send('EXEC', [])

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
      await this.queue.redisClient.send('MULTI', [])
      await this.queue.redisClient.send('LREM', [deadLetterQueueKey, '0', jobId])
      await this.queue.redisClient.send('DEL', [deadLetterKey])
      await this.queue.redisClient.send('EXEC', [])

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

      // Remove each job key
      await this.queue.redisClient.send('MULTI', [])

      for (const jobId of jobIds) {
        const deadLetterKey = `${deadLetterQueueKey}:${jobId}`
        await this.queue.redisClient.send('DEL', [deadLetterKey])
      }

      // Clear the list
      await this.queue.redisClient.send('DEL', [deadLetterQueueKey])
      await this.queue.redisClient.send('EXEC', [])

      this.logger.info(`Dead letter queue ${this.deadLetterQueueName} cleared (${jobIds.length} jobs)`)
    }
    catch (err) {
      this.logger.error(`Failed to clear dead letter queue: ${(err as Error).message}`)
      throw err
    }
  }
}
