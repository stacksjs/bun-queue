import type { Job as QueueJob } from '../job'
import type { JobBase as Job } from '../job-base'

export interface BatchableJob extends Job {
  batchId?: string
  allowFailures?: boolean
}

export interface Batch {
  id: string
  name?: string
  totalJobs: number
  pendingJobs: number
  processedJobs: number
  failedJobs: number
  createdAt: Date
  finishedAt?: Date
  cancelledAt?: Date
}

export interface PendingBatch {
  add: (jobs: Job | Job[]) => this
  before: (callback: (batch: Batch) => void) => this
  progress: (callback: (batch: Batch) => void) => this
  then: (callback: (batch: Batch) => void) => this
  catch: (callback: (batch: Batch, error: Error) => void) => this
  finally: (callback: (batch: Batch) => void) => this
  allowFailures: (failures?: number) => this
  onQueue: (queue: string) => this
  onConnection: (connection: string) => this
  dispatch: () => Promise<Batch>
}

export class JobBatch implements PendingBatch {
  private jobs: Job[] = []
  private beforeCallbacks: Array<(batch: Batch) => void> = []
  private progressCallbacks: Array<(batch: Batch) => void> = []
  private thenCallbacks: Array<(batch: Batch) => void> = []
  private catchCallbacks: Array<(batch: Batch, error: Error) => void> = []
  private finallyCallbacks: Array<(batch: Batch) => void> = []
  private allowedFailures?: number
  private queueName?: string
  private connectionName?: string

  constructor(private batchName?: string) {}

  add(jobs: Job | Job[]): this {
    const jobArray = Array.isArray(jobs) ? jobs : [jobs]
    this.jobs.push(...jobArray)
    return this
  }

  before(callback: (batch: Batch) => void): this {
    this.beforeCallbacks.push(callback)
    return this
  }

  progress(callback: (batch: Batch) => void): this {
    this.progressCallbacks.push(callback)
    return this
  }

  then(callback: (batch: Batch) => void): this {
    this.thenCallbacks.push(callback)
    return this
  }

  catch(callback: (batch: Batch, error: Error) => void): this {
    this.catchCallbacks.push(callback)
    return this
  }

  finally(callback: (batch: Batch) => void): this {
    this.finallyCallbacks.push(callback)
    return this
  }

  allowFailures(failures: number = Infinity): this {
    this.allowedFailures = failures
    return this
  }

  onQueue(queue: string): this {
    this.queueName = queue
    return this
  }

  onConnection(connection: string): this {
    this.connectionName = connection
    return this
  }

  async dispatch(): Promise<Batch> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2)}`

    const batch: Batch = {
      id: batchId,
      name: this.batchName,
      totalJobs: this.jobs.length,
      pendingJobs: this.jobs.length,
      processedJobs: 0,
      failedJobs: 0,
      createdAt: new Date(),
    }

    // Execute before callbacks
    this.beforeCallbacks.forEach(callback => callback(batch))

    // Set batch properties on jobs and dispatch them
    const dispatchPromises = this.jobs.map(async (job, index) => {
      // Set batch properties
      if ('batchId' in job) {
        (job as BatchableJob).batchId = batchId
      }
      if ('allowFailures' in job && this.allowedFailures !== undefined) {
        (job as BatchableJob).allowFailures = this.allowedFailures !== undefined
      }

      // Override queue and connection if specified
      if (this.queueName)
        job.onQueue(this.queueName)
      if (this.connectionName)
        job.onConnection(this.connectionName)

      try {
        const queueJob = await job.dispatch()

        // Monitor job completion
        this.monitorJob(queueJob, batch, index)

        return queueJob
      }
      catch (error) {
        batch.failedJobs++
        batch.pendingJobs--

        this.progressCallbacks.forEach(callback => callback(batch))
        this.catchCallbacks.forEach(callback => callback(batch, error as Error))

        throw error
      }
    })

    try {
      await Promise.all(dispatchPromises)
      return batch
    }
    catch (error) {
      // Handle batch-level errors
      this.catchCallbacks.forEach(callback => callback(batch, error as Error))
      throw error
    }
  }

  private async monitorJob(queueJob: QueueJob<any>, batch: Batch, _jobIndex: number): Promise<void> {
    // This is a simplified monitoring approach
    // In a real implementation, you'd want to use proper event listeners

    const checkJob = async () => {
      await queueJob.refresh()

      if (queueJob.finishedOn) {
        if (queueJob.failedReason) {
          batch.failedJobs++
        }
        else {
          batch.processedJobs++
        }
        batch.pendingJobs--

        // Execute progress callbacks
        this.progressCallbacks.forEach(callback => callback(batch))

        // Check if batch is complete
        if (batch.pendingJobs === 0) {
          batch.finishedAt = new Date()

          if (batch.failedJobs === 0 || (this.allowedFailures && batch.failedJobs <= this.allowedFailures)) {
            this.thenCallbacks.forEach(callback => callback(batch))
          }
          else {
            this.catchCallbacks.forEach(callback =>
              callback(batch, new Error(`Batch failed with ${batch.failedJobs} failed jobs`)),
            )
          }

          this.finallyCallbacks.forEach(callback => callback(batch))
        }
      }
      else {
        // Job still pending, check again later
        setTimeout(checkJob, 1000)
      }
    }

    setTimeout(checkJob, 100)
  }
}

export class Bus {
  static batch(name?: string): PendingBatch {
    return new JobBatch(name)
  }

  static async dispatch(job: Job, ...args: any[]): Promise<QueueJob<any>> {
    return job.dispatch(...args)
  }

  static async dispatchSync(job: Job, ...args: any[]): Promise<any> {
    return job.dispatchSync(...args)
  }

  static async dispatchIf(
    condition: boolean,
    job: Job,
    ...args: any[]
  ): Promise<QueueJob<any> | null> {
    return job.dispatchIf(condition, ...args)
  }

  static async dispatchUnless(
    condition: boolean,
    job: Job,
    ...args: any[]
  ): Promise<QueueJob<any> | null> {
    return job.dispatchUnless(condition, ...args)
  }

  static async dispatchAfter(
    delay: number,
    job: Job,
    ...args: any[]
  ): Promise<QueueJob<any>> {
    return job.dispatchAfter(delay, ...args)
  }

  static chain(jobs: Job[]): Promise<QueueJob<any>[]> {
    return Promise.all(jobs.map(job => job.dispatch()))
  }
}
