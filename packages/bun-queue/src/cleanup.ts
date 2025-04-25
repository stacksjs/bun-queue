import type { Job } from './job'
import type { Queue } from './queue'
import { createLogger } from './logger'

interface CleanupOptions {
  /**
   * Maximum number of completed jobs to keep
   */
  maxCompletedJobs?: number
  /**
   * Maximum number of failed jobs to keep
   */
  maxFailedJobs?: number
  /**
   * Time in milliseconds after which completed jobs will be removed
   */
  completedJobsLifetime?: number
  /**
   * Time in milliseconds after which failed jobs will be removed
   */
  failedJobsLifetime?: number
  /**
   * Interval in milliseconds to run cleanup
   */
  cleanupInterval?: number
}

class CleanupService {
  private readonly queue: Queue
  private readonly logger = createLogger()
  private readonly options: CleanupOptions
  private timer: NodeJS.Timeout | null = null
  private running = false

  constructor(queue: Queue, options: CleanupOptions = {}) {
    this.queue = queue
    this.options = {
      maxCompletedJobs: options.maxCompletedJobs || 1000,
      maxFailedJobs: options.maxFailedJobs || 1000,
      completedJobsLifetime: options.completedJobsLifetime || 24 * 60 * 60 * 1000, // 24 hours
      failedJobsLifetime: options.failedJobsLifetime || 7 * 24 * 60 * 60 * 1000, // 7 days
      cleanupInterval: options.cleanupInterval || 60 * 60 * 1000, // 1 hour
    }
    this.logger.debug(`Cleanup service created for queue ${queue.name}`)
  }

  /**
   * Start the cleanup service
   */
  start(): void {
    if (this.running)
      return
    this.running = true

    this.logger.info(`Starting cleanup service for queue ${this.queue.name}`)

    // Run cleanup immediately
    this.cleanup()

    // Schedule periodic cleanup
    this.timer = setInterval(() => this.cleanup(), this.options.cleanupInterval!)
  }

  /**
   * Stop the cleanup service
   */
  stop(): void {
    if (!this.running)
      return
    this.running = false

    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    this.logger.info(`Stopped cleanup service for queue ${this.queue.name}`)
  }

  /**
   * Run a cleanup cycle
   */
  private async cleanup(): Promise<void> {
    try {
      this.logger.debug(`Running cleanup for queue ${this.queue.name}`)

      await Promise.all([
        this.cleanupCompletedJobs(),
        this.cleanupFailedJobs(),
      ])
    }
    catch (error) {
      this.logger.error(`Error during cleanup: ${(error as Error).message}`)
    }
  }

  /**
   * Cleanup completed jobs
   */
  private async cleanupCompletedJobs(): Promise<void> {
    try {
      // Get all completed jobs
      const completedJobs = await this.queue.getJobs('completed')
      this.logger.debug(`Found ${completedJobs.length} completed jobs`)

      const now = Date.now()
      const jobsToRemove: Job[] = []

      // Identify jobs that exceed lifetime or count limits
      completedJobs.forEach((job) => {
        // Skip jobs that should be kept
        if (job.opts.keepJobs)
          return

        // Check if exceeds lifetime
        if (job.finishedOn && (now - job.finishedOn > this.options.completedJobsLifetime!)) {
          jobsToRemove.push(job)
        }
      })

      // Check if we're over the max count and need to remove more jobs
      if (completedJobs.length - jobsToRemove.length > this.options.maxCompletedJobs!) {
        // Sort by finished time (oldest first)
        const sortedByAge = completedJobs
          .filter(job => !job.opts.keepJobs && !jobsToRemove.includes(job))
          .sort((a, b) => (a.finishedOn || 0) - (b.finishedOn || 0))

        // Add oldest jobs to remove list until we're under the limit
        const additionalToRemove = completedJobs.length - jobsToRemove.length - this.options.maxCompletedJobs!
        jobsToRemove.push(...sortedByAge.slice(0, additionalToRemove))
      }

      // Remove the jobs
      for (const job of jobsToRemove) {
        await job.remove()
      }

      this.logger.info(`Removed ${jobsToRemove.length} completed jobs from queue ${this.queue.name}`)
    }
    catch (error) {
      this.logger.error(`Error cleaning completed jobs: ${(error as Error).message}`)
    }
  }

  /**
   * Cleanup failed jobs
   */
  private async cleanupFailedJobs(): Promise<void> {
    try {
      // Get all failed jobs
      const failedJobs = await this.queue.getJobs('failed')
      this.logger.debug(`Found ${failedJobs.length} failed jobs`)

      const now = Date.now()
      const jobsToRemove: Job[] = []

      // Identify jobs that exceed lifetime or count limits
      failedJobs.forEach((job) => {
        // Skip jobs that should be kept
        if (job.opts.keepJobs)
          return

        // Check if exceeds lifetime
        if (job.finishedOn && (now - job.finishedOn > this.options.failedJobsLifetime!)) {
          jobsToRemove.push(job)
        }
      })

      // Check if we're over the max count and need to remove more jobs
      if (failedJobs.length - jobsToRemove.length > this.options.maxFailedJobs!) {
        // Sort by finished time (oldest first)
        const sortedByAge = failedJobs
          .filter(job => !job.opts.keepJobs && !jobsToRemove.includes(job))
          .sort((a, b) => (a.finishedOn || 0) - (b.finishedOn || 0))

        // Add oldest jobs to remove list until we're under the limit
        const additionalToRemove = failedJobs.length - jobsToRemove.length - this.options.maxFailedJobs!
        jobsToRemove.push(...sortedByAge.slice(0, additionalToRemove))
      }

      // Remove the jobs
      for (const job of jobsToRemove) {
        await job.remove()
      }

      this.logger.info(`Removed ${jobsToRemove.length} failed jobs from queue ${this.queue.name}`)
    }
    catch (error) {
      this.logger.error(`Error cleaning failed jobs: ${(error as Error).message}`)
    }
  }
}

export { type CleanupOptions, CleanupService }
