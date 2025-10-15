import type { Job } from './job'
import type { JobContract } from './job-base'
import { createLogger } from './logger'
import { JobMiddlewareStack } from './middleware'

export interface JobProcessorOptions {
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'
}

export class JobProcessor {
  private logger = createLogger()

  constructor(options: JobProcessorOptions = {}) {
    if (options.logLevel) {
      this.logger.setLevel(options.logLevel)
    }
  }

  async process(job: Job<any>): Promise<any> {
    const jobData = job.data

    // Check if this is a job class (has job class structure)
    if (this.isJobClass(jobData)) {
      return this.processJobClass(job, jobData)
    }

    // Handle regular data jobs (existing functionality)
    return this.processDataJob(job, jobData)
  }

  private isJobClass(data: any): boolean {
    return (
      data
      && typeof data === 'object'
      && data.class
      && data.method
      && data.job
      && typeof data.job.handle === 'function'
    )
  }

  private async processJobClass(job: Job<any>, jobData: any): Promise<any> {
    const { job: jobInstance, args = [] } = jobData as {
      job: JobContract
      args: any[]
    }

    // Set the underlying job reference for InteractsWithQueue methods
    jobInstance.job = job

    this.logger.debug(`Processing job class: ${jobInstance.constructor.name}`)

    try {
      // Process middleware stack if present
      if (jobInstance.middleware && jobInstance.middleware.length > 0) {
        return this.processWithMiddleware(jobInstance, args)
      }

      // Process job directly
      return this.executeJob(jobInstance, args)
    }
    catch (error) {
      this.logger.error(`Job class failed: ${(error as Error).message}`)
      throw error
    }
  }

  private async processWithMiddleware(jobInstance: JobContract, args: any[]): Promise<any> {
    const middleware = jobInstance.middleware || []
    const stack = new JobMiddlewareStack(jobInstance, middleware)

    let result: any

    await stack.then(async () => {
      result = await this.executeJob(jobInstance, args)
    })

    return result
  }

  private async executeJob(jobInstance: JobContract, args: any[]): Promise<any> {
    const startTime = Date.now()

    try {
      // Check if job should be skipped due to unique constraints, etc.
      if (this.shouldSkipJob(jobInstance)) {
        this.logger.info(`Skipping job ${jobInstance.constructor.name} due to constraints`)
        return { skipped: true, reason: 'constraints' }
      }

      // Execute the job
      const result = await jobInstance.handle(...args)

      const duration = Date.now() - startTime
      this.logger.debug(`Job ${jobInstance.constructor.name} completed in ${duration}ms`)

      return result
    }
    catch (error) {
      const duration = Date.now() - startTime
      this.logger.error(`Job ${jobInstance.constructor.name} failed after ${duration}ms: ${(error as Error).message}`)
      throw error
    }
  }

  private shouldSkipJob(_jobInstance: JobContract): boolean {
    // This would be where you'd implement unique job logic, rate limiting checks, etc.
    // For now, we'll just return false to process all jobs
    return false
  }

  private async processDataJob(job: Job<any>, data: any): Promise<any> {
    // This handles regular data-based jobs (existing functionality)
    this.logger.debug(`Processing data job: ${job.id}`)

    // You could extend this to support custom processors or handlers
    // For now, just return the data (existing behavior)
    return data
  }

  async processWithTimeout(job: Job<any>, timeout?: number): Promise<any> {
    const jobData = job.data
    const actualTimeout = timeout
      || (this.isJobClass(jobData) ? jobData.job?.timeout : undefined)
      || 30000 // Default 30 seconds

    return Promise.race([
      this.process(job),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Job timed out after ${actualTimeout}ms`))
        }, actualTimeout)
      }),
    ])
  }
}

// Utility function to create a processor for job classes
export function createJobProcessor(options: JobProcessorOptions = {}): JobProcessor {
  return new JobProcessor(options)
}

// Global processor instance for convenience
let globalProcessor: JobProcessor | null = null

export function getGlobalJobProcessor(options: JobProcessorOptions = {}): JobProcessor {
  if (!globalProcessor) {
    globalProcessor = new JobProcessor(options)
  }
  return globalProcessor
}

export function setGlobalJobProcessor(processor: JobProcessor): void {
  globalProcessor = processor
}
