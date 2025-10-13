import type { Job } from './job'
import type { JobContract } from './job-base'
import { getQueueManager } from './queue-manager'

export async function dispatch<T extends JobContract>(
  job: T,
  ...args: any[]
): Promise<Job<any>> {
  return job.dispatch?.(...args) ?? Promise.reject(new Error('Job dispatch method not implemented'))
}

export async function dispatchSync<T extends JobContract>(
  job: T,
  ...args: any[]
): Promise<any> {
  return job.dispatchSync?.(...args) ?? Promise.reject(new Error('Job dispatchSync method not implemented'))
}

export async function dispatchIf<T extends JobContract>(
  condition: boolean,
  job: T,
  ...args: any[]
): Promise<Job<any> | null> {
  return job.dispatchIf?.(condition, ...args) ?? Promise.reject(new Error('Job dispatchIf method not implemented'))
}

export async function dispatchUnless<T extends JobContract>(
  condition: boolean,
  job: T,
  ...args: any[]
): Promise<Job<any> | null> {
  return job.dispatchUnless?.(condition, ...args) ?? Promise.reject(new Error('Job dispatchUnless method not implemented'))
}

export async function dispatchAfter<T extends JobContract>(
  delay: number,
  job: T,
  ...args: any[]
): Promise<Job<any>> {
  return job.dispatchAfter?.(delay, ...args) ?? Promise.reject(new Error('Job dispatchAfter method not implemented'))
}

export interface DispatchChain {
  onQueue: (queue: string) => this
  onConnection: (connection: string) => this
  delay: (ms: number) => this
  after: (delay: number) => this
  withTries: (attempts: number) => this
  withTimeout: (timeout: number) => this
  withBackoff: (backoff: number[]) => this
  withTags: (...tags: string[]) => this
  dispatch: () => Promise<Job<any>>
  dispatchSync: () => Promise<any>
}

export class DispatchableChain implements DispatchChain {
  private jobInstance: JobContract
  private args: any[]
  private queueName?: string
  private connectionName?: string
  private delayMs?: number
  private attempts?: number
  private timeoutMs?: number
  private backoffArray?: number[]
  private jobTags?: string[]

  constructor(job: JobContract, ...args: any[]) {
    this.jobInstance = job
    this.args = args
  }

  onQueue(queue: string): this {
    this.queueName = queue
    return this
  }

  onConnection(connection: string): this {
    this.connectionName = connection
    return this
  }

  delay(ms: number): this {
    this.delayMs = ms
    return this
  }

  after(delay: number): this {
    return this.delay(delay)
  }

  withTries(attempts: number): this {
    this.attempts = attempts
    return this
  }

  withTimeout(timeout: number): this {
    this.timeoutMs = timeout
    return this
  }

  withBackoff(backoff: number[]): this {
    this.backoffArray = backoff
    return this
  }

  withTags(...tags: string[]): this {
    this.jobTags = tags
    return this
  }

  async dispatch(): Promise<Job<any>> {
    const job = { ...this.jobInstance }

    if (this.queueName)
      job.queue = this.queueName
    if (this.connectionName)
      job.connection = this.connectionName
    if (this.delayMs)
      job.delay = this.delayMs
    if (this.attempts)
      job.tries = this.attempts
    if (this.timeoutMs)
      job.timeout = this.timeoutMs
    if (this.backoffArray)
      job.backoff = this.backoffArray
    if (this.jobTags)
      job.tags = [...(job.tags || []), ...this.jobTags]

    return job.dispatch?.(...this.args) ?? Promise.reject(new Error('Job dispatch method not implemented'))
  }

  async dispatchSync(): Promise<any> {
    return this.jobInstance.dispatchSync?.(...this.args) ?? Promise.reject(new Error('Job dispatchSync method not implemented'))
  }
}

export function chain<T extends JobContract>(
  job: T,
  ...args: any[]
): DispatchableChain {
  return new DispatchableChain(job, ...args)
}

export interface Batch {
  id: string
  name?: string
  jobs: JobContract[]
  options?: BatchOptions
  dispatch: () => Promise<BatchResult>
}

export interface BatchOptions {
  allowFailures?: boolean
  concurrency?: number
  timeout?: number
  onQueue?: string
  onConnection?: string
}

export interface BatchResult {
  id: string
  jobs: Job<any>[]
  completed: number
  failed: number
  total: number
}

export class JobBatch implements Batch {
  public id: string
  public name?: string
  public jobs: JobContract[] = []
  public options?: BatchOptions

  constructor(name?: string) {
    this.id = `batch_${Date.now()}_${Math.random().toString(36).substring(2)}`
    this.name = name
  }

  add(job: JobContract): this {
    this.jobs.push(job)
    return this
  }

  addMany(jobs: JobContract[]): this {
    this.jobs.push(...jobs)
    return this
  }

  allowFailures(allow = true): this {
    this.options = { ...this.options, allowFailures: allow }
    return this
  }

  withConcurrency(concurrency: number): this {
    this.options = { ...this.options, concurrency }
    return this
  }

  withTimeout(timeout: number): this {
    this.options = { ...this.options, timeout }
    return this
  }

  onQueue(queue: string): this {
    this.options = { ...this.options, onQueue: queue }
    return this
  }

  onConnection(connection: string): this {
    this.options = { ...this.options, onConnection: connection }
    return this
  }

  async dispatch(): Promise<BatchResult> {
    const jobPromises = this.jobs.map(async (job) => {
      const jobClone = { ...job }
      if (this.options?.onQueue)
        jobClone.queue = this.options.onQueue
      if (this.options?.onConnection)
        jobClone.connection = this.options.onConnection

      return jobClone.dispatch?.()
    })

    const dispatchedJobs = await Promise.all(jobPromises)

    return {
      id: this.id,
      jobs: dispatchedJobs,
      completed: 0,
      failed: 0,
      total: dispatchedJobs.length,
    }
  }
}

export function batch(name?: string): JobBatch {
  return new JobBatch(name)
}

export function dispatchChain(jobs: JobContract[]): Promise<Job<any>[]> {
  return Promise.all(jobs.map(job => job.dispatch?.() ?? Promise.reject(new Error('Job dispatch method not implemented'))))
}

export interface QueuedClosure {
  (...args: any[]): Promise<any> | any
}

export async function dispatchFunction(
  fn: QueuedClosure,
  ...args: any[]
): Promise<Job<any>> {
  const queueManager = getQueueManager()
  const queue = queueManager.queue('closures')

  const jobData = {
    type: 'closure',
    function: fn.toString(),
    args,
  }

  return queue.add(jobData)
}
