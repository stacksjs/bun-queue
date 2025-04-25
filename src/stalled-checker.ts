import type { Queue } from './queue'
import { createLogger } from './logger'

class StalledJobChecker {
  private readonly queue: Queue
  private readonly logger = createLogger()
  private timer: NodeJS.Timeout | null = null
  private running = false
  private readonly interval: number
  private readonly maxRetries: number

  constructor(queue: Queue, interval?: number, maxRetries?: number) {
    this.queue = queue
    this.interval = interval || 30000 // Default: check every 30 seconds
    this.maxRetries = maxRetries || 3 // Default: retry stalled jobs up to 3 times
    this.logger.debug(`Stalled job checker created for queue ${queue.name}`)
  }

  /**
   * Start the stalled job checker
   */
  start(): void {
    if (this.running)
      return
    this.running = true

    this.logger.info(`Starting stalled job checker for queue ${this.queue.name}`)

    // Run check immediately
    this.checkStalledJobs()

    // Schedule periodic checks
    this.timer = setInterval(() => this.checkStalledJobs(), this.interval)
  }

  /**
   * Stop the stalled job checker
   */
  stop(): void {
    if (!this.running)
      return
    this.running = false

    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    this.logger.info(`Stopped stalled job checker for queue ${this.queue.name}`)
  }

  /**
   * Check for stalled jobs
   */
  private async checkStalledJobs(): Promise<void> {
    try {
      this.logger.debug(`Checking for stalled jobs in queue ${this.queue.name}`)

      // Get all active jobs
      const activeJobs = await this.queue.getJobs('active')

      if (activeJobs.length === 0) {
        this.logger.debug('No active jobs to check')
        return
      }

      const now = Date.now()
      const stalledThreshold = 10000 // Consider a job stalled if no update for 10 seconds

      // Check each active job
      for (const job of activeJobs) {
        // Skip jobs that have a recent update
        if (job.processedOn && now - job.processedOn < stalledThreshold) {
          continue
        }

        this.logger.warn(`Found stalled job ${job.id} in queue ${this.queue.name}`)

        // Check if we should retry this job
        if (job.attemptsMade < this.maxRetries) {
          // Move the job back to the waiting queue for retry
          await this.queue.redisClient.send('MULTI', [])
          await this.queue.redisClient.send('LREM', [this.queue.getKey('active'), '0', job.id])
          await this.queue.redisClient.send('LPUSH', [this.queue.getKey('waiting'), job.id])
          await this.queue.redisClient.send('EXEC', [])

          this.logger.info(`Moved stalled job ${job.id} back to waiting queue for retry`)

          // If a job is stalled, the worker didn't have a chance to increment the attemptsMade counter
          // So we need to update it manually
          const jobKey = this.queue.getJobKey(job.id)
          const attemptsMade = job.attemptsMade + 1
          await this.queue.redisClient.send('HSET', [jobKey, 'attemptsMade', attemptsMade.toString()])

          // Also emit a stalled event if we have access to the event emitter
          if (this.queue.events) {
            this.queue.events.emitJobStalled(job.id)
          }
        }
        else {
          this.logger.warn(`Stalled job ${job.id} has reached max retries, moving to failed`)

          // Move the job to the failed queue
          const err = new Error('Job stalled and exceeded maximum stalled job retries')
          await job.moveToFailed(err, 'Job stalled and exceeded maximum stalled job retries')
        }
      }
    }
    catch (error) {
      this.logger.error(`Error checking stalled jobs: ${(error as Error).message}`)
    }
  }
}

export { StalledJobChecker }
