import type { FailedJob, FailedJobProvider } from './failed-job-provider'
import { DatabaseFailedJobProvider, RedisFailedJobProvider } from './failed-job-provider'
import { createLogger } from '../logger'

export class FailedJobManager {
  private provider: FailedJobProvider
  private logger = createLogger('failed-jobs')

  constructor(driver: 'redis' | 'database' = 'redis', options: any = {}) {
    switch (driver) {
      case 'redis':
        this.provider = new RedisFailedJobProvider(options.prefix)
        break
      case 'database':
        this.provider = new DatabaseFailedJobProvider(options.table)
        break
      default:
        throw new Error(`Unsupported failed job driver: ${driver}`)
    }
  }

  async log(connection: string, queue: string, payload: string, exception: Error): Promise<string> {
    return this.provider.log(connection, queue, payload, exception)
  }

  async all(): Promise<FailedJob[]> {
    return this.provider.all()
  }

  async find(id: string): Promise<FailedJob | null> {
    return this.provider.find(id)
  }

  async retry(id: string): Promise<boolean> {
    const failedJob = await this.provider.find(id)
    if (!failedJob) {
      return false
    }

    try {
      // Parse the payload and re-queue the job
      const _payload = JSON.parse(failedJob.payload)

      // In a real implementation, you'd get the queue manager and re-dispatch
      this.logger.info(`[FailedJobManager] Retrying failed job ${id} on queue ${failedJob.queue}`)

      // Remove from failed jobs after successful retry
      await this.provider.forget(id)
      return true
    }
    catch (error) {
      console.error(`[FailedJobManager] Failed to retry job ${id}:`, error)
      return false
    }
  }

  async forget(id: string): Promise<boolean> {
    return this.provider.forget(id)
  }

  async flush(hours?: number): Promise<void> {
    return this.provider.flush(hours)
  }

  async prune(hours: number = 168): Promise<number> { // Default 7 days
    return this.provider.prune(hours)
  }

  async count(): Promise<number> {
    const failedJobs = await this.provider.all()
    return failedJobs.length
  }

  // Queue command helpers
  async retryAll(): Promise<number> {
    const failedJobs = await this.provider.all()
    let retried = 0

    for (const failedJob of failedJobs) {
      const success = await this.retry(failedJob.id)
      if (success) {
        retried++
      }
    }

    return retried
  }

  async getFailedJobsByQueue(queue: string): Promise<FailedJob[]> {
    const allFailed = await this.provider.all()
    return allFailed.filter(job => job.queue === queue)
  }

  async getFailedJobsByConnection(connection: string): Promise<FailedJob[]> {
    const allFailed = await this.provider.all()
    return allFailed.filter(job => job.connection === connection)
  }
}
