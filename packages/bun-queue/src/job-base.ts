import type { Job } from './job'
import type { JobOptions } from './types'

export interface ShouldQueue {
  handle: (...args: any[]) => Promise<any> | any
}

export interface ShouldBeUnique {
  uniqueId: () => string
}

export interface ShouldBatch {
  batchId?: string
}

export interface Queueable {
  onQueue: (queue: string) => this
  onConnection: (connection: string) => this
  withDelay: (delay: number) => this
  allOnQueue: (queue: string) => this
  allOnConnection: (connection: string) => this
}

export interface JobContract extends ShouldQueue {
  queue?: string
  connection?: string
  delay?: number
  tries?: number
  timeout?: number
  backoff?: number[]
  maxExceptions?: number
  deleteWhenMissingModels?: boolean
  middleware?: JobMiddleware[]
  uniqueId?: () => string | undefined
  tags?: string[]
  failOnTimeout?: boolean
  job?: Job<any>
  dispatch?: (...args: any[]) => Promise<Job<any>>
  dispatchSync?: (...args: any[]) => Promise<any>
  dispatchIf?: (condition: boolean, ...args: any[]) => Promise<Job<any> | null>
  dispatchUnless?: (condition: boolean, ...args: any[]) => Promise<Job<any> | null>
  dispatchAfter?: (delay: number, ...args: any[]) => Promise<Job<any>>
}

export interface JobMiddleware {
  handle: (job: JobContract, next: () => Promise<void>) => Promise<void>
}

export interface Dispatchable {
  dispatch: (...args: any[]) => Promise<Job<any>>
  dispatchSync: (...args: any[]) => Promise<any>
  dispatchIf: (condition: boolean, ...args: any[]) => Promise<Job<any> | null>
  dispatchUnless: (condition: boolean, ...args: any[]) => Promise<Job<any> | null>
  dispatchAfter: (delay: number, ...args: any[]) => Promise<Job<any>>
}

export interface InteractsWithQueue {
  job?: Job<any>
  fail: (exception?: Error) => Promise<void>
  release: (delay?: number) => Promise<void>
  delete: () => Promise<void>
}

export abstract class JobBase implements JobContract, Queueable, Dispatchable, InteractsWithQueue {
  public queue?: string
  public connection?: string
  public delay?: number
  public tries?: number = 3
  public timeout?: number
  public backoff?: number[]
  public maxExceptions?: number
  public deleteWhenMissingModels?: boolean = false
  public middleware?: JobMiddleware[] = []
  public tags?: string[] = []
  public failOnTimeout?: boolean = false

  public job?: Job<any>

  abstract handle(...args: any[]): Promise<any> | any

  async dispatch(...args: any[]): Promise<Job<any>> {
    const queueManager = await getQueueManager()
    const queue = queueManager.connection(this.connection).queue(this.queue)

    // Check if this is an EnhancedQueue for enhanced support
    if ('dispatchJob' in queue && typeof queue.dispatchJob === 'function') {
      return (queue as any).dispatchJob(this, ...args)
    }

    // Fallback to regular queue.add for compatibility
    const jobOptions: JobOptions = {
      delay: this.delay,
      attempts: this.tries,
      timeout: this.timeout,
      backoff: this.backoff ? { type: 'fixed', delay: this.backoff[0] } : undefined,
      jobId: this.uniqueId?.(),
    }

    const jobData = {
      class: this.constructor.name,
      method: 'handle',
      args,
      job: this,
    }

    return queue.add(jobData, jobOptions)
  }

  async dispatchSync(...args: any[]): Promise<any> {
    return this.handle(...args)
  }

  async dispatchIf(condition: boolean, ...args: any[]): Promise<Job<any> | null> {
    if (condition) {
      return this.dispatch(...args)
    }
    return null
  }

  async dispatchUnless(condition: boolean, ...args: any[]): Promise<Job<any> | null> {
    return this.dispatchIf(!condition, ...args)
  }

  async dispatchAfter(delay: number, ...args: any[]): Promise<Job<any>> {
    this.delay = delay
    return this.dispatch(...args)
  }

  onQueue(queue: string): this {
    this.queue = queue
    return this
  }

  onConnection(connection: string): this {
    this.connection = connection
    return this
  }

  withDelay(delay: number): this {
    this.delay = delay
    return this
  }

  allOnQueue(queue: string): this {
    this.queue = queue
    return this
  }

  allOnConnection(connection: string): this {
    this.connection = connection
    return this
  }

  withTries(tries: number): this {
    this.tries = tries
    return this
  }

  withTimeout(timeout: number): this {
    this.timeout = timeout
    return this
  }

  withBackoff(backoff: number[]): this {
    this.backoff = backoff
    return this
  }

  withMiddleware(...middleware: JobMiddleware[]): this {
    this.middleware = [...(this.middleware || []), ...middleware]
    return this
  }

  withTags(...tags: string[]): this {
    this.tags = [...(this.tags || []), ...tags]
    return this
  }

  async fail(exception?: Error): Promise<void> {
    if (this.job) {
      await this.job.moveToFailed(exception || new Error('Job failed manually'))
    }
  }

  async release(delay?: number): Promise<void> {
    if (this.job && delay) {
      // Re-queue the job with a delay
      const queueManager = await getQueueManager()
      const queue = queueManager.connection(this.connection).queue(this.queue)

      const jobData = {
        class: this.constructor.name,
        method: 'handle',
        args: [] as any[],
        job: this,
      }

      await queue.add(jobData, { delay })
      await this.job.remove()
    }
  }

  async delete(): Promise<void> {
    if (this.job) {
      await this.job.remove()
    }
  }

  uniqueId(): string | undefined {
    return undefined
  }
}

let queueManagerInstance: QueueManager | null = null

export async function getQueueManager(): Promise<QueueManager> {
  if (!queueManagerInstance) {
    const { QueueManager } = await import('./queue-manager')
    queueManagerInstance = new QueueManager()
  }
  return queueManagerInstance
}

export interface QueueManager {
  connection: (name?: string) => QueueConnection
  queue: (name?: string) => any
}

export interface QueueConnection {
  queue: (name?: string) => any
}
