import type { Job as QueueJob } from '../job'
import type { JobBase as Job } from '../job-base'
import type { QueueManagerConfig } from '../types'
import { FailedJobManager } from '../failed'
import { createLogger } from '../logger'

export interface WorkerOptions {
  name?: string
  connection?: string
  queue?: string[]
  delay?: number
  memory?: number
  timeout?: number
  sleep?: number
  maxTries?: number
  force?: boolean
  stopWhenEmpty?: boolean
  maxJobs?: number
  maxTime?: number
  rest?: number
}

export interface WorkerEvents {
  jobProcessing: (job: QueueJob<any>) => void
  jobProcessed: (job: QueueJob<any>, result: any) => void
  jobFailed: (job: QueueJob<any>, error: Error) => void
  jobRetry: (job: QueueJob<any>) => void
  jobTimeout: (job: QueueJob<any>) => void
  workerStopping: (status: number) => void
}

export class QueueWorker {
  private logger = createLogger()
  private failedJobManager: FailedJobManager
  private isRunning = false
  private shouldStop = false
  private jobsProcessed = 0
  private startTime = Date.now()
  private lastRestart = Date.now()
  private events: Partial<WorkerEvents> = {}

  constructor(
    private config: QueueManagerConfig,
    private options: WorkerOptions = {},
  ) {
    this.failedJobManager = new FailedJobManager(
      config.failed?.driver || 'redis',
      config.failed,
    )

    if (options.name) {
      this.logger.info(`Queue worker "${options.name}" initialized`)
    }
  }

  async work(): Promise<void> {
    this.isRunning = true
    this.shouldStop = false
    this.startTime = Date.now()
    this.jobsProcessed = 0

    this.logger.info('Queue worker started')

    while (!this.shouldStop && this.isRunning) {
      try {
        await this.runNextJob()
        await this.checkLimits()
      }
      catch (error) {
        this.logger.error('Worker error:', error)
        await this.sleep(this.options.sleep || 3000)
      }
    }

    this.logger.info('Queue worker stopped')
  }

  async stop(status: number = 0, options: { wait?: boolean } = {}): Promise<void> {
    this.shouldStop = true

    if (options.wait) {
      // Wait for current job to finish
      while (this.isRunning) {
        await this.sleep(100)
      }
    }
    else {
      this.isRunning = false
    }

    this.events.workerStopping?.(status)
    this.logger.info(`Worker stopped with status ${status}`)
  }

  async restart(): Promise<void> {
    await this.stop(0, { wait: true })
    this.lastRestart = Date.now()
    await this.work()
  }

  private async runNextJob(): Promise<void> {
    const { getQueueManager } = await import('../queue-manager')
    const queueManager = getQueueManager(this.config)

    const connection = queueManager.connection(this.options.connection)
    const queues = this.options.queue || ['default']

    for (const queueName of queues) {
      const queue = connection.queue(queueName)

      // Get next job from queue
      const job = await this.getNextJob(queue)
      if (job) {
        await this.processJob(job, queueName)
        return
      }
    }

    // No jobs found, sleep
    if (this.options.stopWhenEmpty) {
      this.shouldStop = true
      return
    }

    await this.sleep(this.options.sleep || 3000)
  }

  private async getNextJob(queue: any): Promise<QueueJob<any> | null> {
    try {
      // Get waiting jobs
      const waitingJobs = await queue.getJobs('waiting', 0, 0)
      if (waitingJobs.length > 0) {
        return waitingJobs[0]
      }

      // Check delayed jobs that are ready
      const delayedJobs = await queue.getJobs('delayed')
      for (const job of delayedJobs) {
        if (job.timestamp + job.delay <= Date.now()) {
          return job
        }
      }

      return null
    }
    catch (error) {
      this.logger.error('Error getting next job:', error)
      return null
    }
  }

  private async processJob(queueJob: QueueJob<any>, queueName: string): Promise<void> {
    const startTime = Date.now()

    try {
      this.events.jobProcessing?.(queueJob)
      this.logger.debug(`Processing job ${queueJob.id} from queue ${queueName}`)

      // Move job to active
      // await queueJob.moveToActive()

      // Process the job
      const result = await this.executeJob(queueJob)

      // Move job to completed
      await queueJob.moveToCompleted(result)

      const duration = Date.now() - startTime
      this.logger.debug(`Job ${queueJob.id} completed in ${duration}ms`)

      this.events.jobProcessed?.(queueJob, result)
      this.jobsProcessed++
    }
    catch (error) {
      await this.handleJobException(queueJob, error as Error, queueName)
    }
  }

  private async executeJob(queueJob: QueueJob<any>): Promise<any> {
    const jobData = queueJob.data

    // Check if this is a job class
    if (this.isJobClass(jobData)) {
      return this.executeJobClass(queueJob, jobData)
    }

    // Handle regular data jobs
    return jobData
  }

  private async executeJobClass(queueJob: QueueJob<any>, jobData: any): Promise<any> {
    const { job: jobInstance, args = [] } = jobData as {
      job: Job
      args: any[]
    }

    // Set the queue job reference
    jobInstance.job = queueJob

    // Check timeout
    const timeout = jobInstance.timeout || this.options.timeout || 60000
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Job timeout')), timeout)
    })

    try {
      // Execute with timeout
      const result = await Promise.race([
        jobInstance.handle(...args),
        timeoutPromise,
      ])

      return result
    }
    catch (error) {
      if ((error as Error).message === 'Job timeout') {
        this.events.jobTimeout?.(queueJob)
        throw new Error(`Job ${queueJob.id} timed out after ${timeout}ms`)
      }
      throw error
    }
  }

  private async handleJobException(queueJob: QueueJob<any>, error: Error, queueName: string): Promise<void> {
    this.logger.error(`Job ${queueJob.id} failed:`, error)

    const maxTries = this.getJobMaxTries(queueJob)

    if (queueJob.attemptsMade < maxTries) {
      // Retry the job
      await this.retryJob(queueJob, error)
    }
    else {
      // Move to failed
      await this.failJob(queueJob, error, queueName)
    }

    this.events.jobFailed?.(queueJob, error)
  }

  private async retryJob(queueJob: QueueJob<any>, error: Error): Promise<void> {
    const delay = this.calculateRetryDelay(queueJob)

    this.logger.info(`Retrying job ${queueJob.id} in ${delay}ms (attempt ${queueJob.attemptsMade + 1})`)

    // In a real implementation, you'd reschedule the job with delay
    this.events.jobRetry?.(queueJob)
  }

  private async failJob(queueJob: QueueJob<any>, error: Error, queueName: string): Promise<void> {
    // Log to failed jobs
    await this.failedJobManager.log(
      this.options.connection || 'default',
      queueName,
      JSON.stringify(queueJob.data),
      error,
    )

    // Move job to failed
    await queueJob.moveToFailed(error)

    // Call job's failed method if it exists
    const jobData = queueJob.data
    if (this.isJobClass(jobData) && typeof jobData.job.failed === 'function') {
      try {
        await jobData.job.failed(error)
      }
      catch (failedError) {
        this.logger.error(`Job failed method threw error:`, failedError)
      }
    }

    this.logger.error(`Job ${queueJob.id} failed permanently after ${queueJob.attemptsMade} attempts`)
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

  private getJobMaxTries(queueJob: QueueJob<any>): number {
    const jobData = queueJob.data

    if (this.isJobClass(jobData) && jobData.job.tries) {
      return jobData.job.tries
    }

    return queueJob.opts.attempts || this.options.maxTries || 3
  }

  private calculateRetryDelay(queueJob: QueueJob<any>): number {
    const jobData = queueJob.data

    if (this.isJobClass(jobData) && jobData.job.backoff) {
      const backoff = jobData.job.backoff
      if (Array.isArray(backoff)) {
        return backoff[Math.min(queueJob.attemptsMade, backoff.length - 1)] * 1000
      }
      return backoff * 1000
    }

    // Default exponential backoff
    return Math.min(1000 * 2 ** queueJob.attemptsMade, 30000)
  }

  private async checkLimits(): Promise<void> {
    // Check max jobs limit
    if (this.options.maxJobs && this.jobsProcessed >= this.options.maxJobs) {
      this.logger.info(`Worker stopping: processed ${this.jobsProcessed} jobs (limit: ${this.options.maxJobs})`)
      this.shouldStop = true
      return
    }

    // Check max time limit
    if (this.options.maxTime) {
      const runtime = Date.now() - this.startTime
      if (runtime >= this.options.maxTime * 1000) {
        this.logger.info(`Worker stopping: runtime ${runtime}ms exceeded limit ${this.options.maxTime}s`)
        this.shouldStop = true
        return
      }
    }

    // Check memory limit
    if (this.options.memory) {
      const memoryUsage = process.memoryUsage()
      const memoryMB = memoryUsage.heapUsed / 1024 / 1024

      if (memoryMB > this.options.memory) {
        this.logger.info(`Worker stopping: memory usage ${memoryMB}MB exceeded limit ${this.options.memory}MB`)
        this.shouldStop = true
      }
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Event registration
  on<K extends keyof WorkerEvents>(event: K, callback: WorkerEvents[K]): this {
    this.events[event] = callback
    return this
  }

  // Stats
  getStats() {
    return {
      jobsProcessed: this.jobsProcessed,
      runtime: Date.now() - this.startTime,
      isRunning: this.isRunning,
      lastRestart: this.lastRestart,
    }
  }
}
