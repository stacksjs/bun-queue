import type { JobContract, JobMiddleware } from './job-base'

export interface MiddlewareStack {
  through: (middleware: JobMiddleware[]) => Promise<void>
  then: (destination: () => Promise<void>) => Promise<void>
}

export class JobMiddlewareStack implements MiddlewareStack {
  private job: JobContract
  private middlewares: JobMiddleware[]
  private index = 0

  constructor(job: JobContract, middlewares: JobMiddleware[]) {
    this.job = job
    this.middlewares = middlewares
  }

  async through(middleware: JobMiddleware[]): Promise<void> {
    this.middlewares = [...this.middlewares, ...middleware]
  }

  async then(destination: () => Promise<void>): Promise<void> {
    return this.executeMiddleware(destination)
  }

  private async executeMiddleware(destination: () => Promise<void>): Promise<void> {
    if (this.index >= this.middlewares.length) {
      return destination()
    }

    const middleware = this.middlewares[this.index++]
    return middleware.handle(this.job, () => this.executeMiddleware(destination))
  }
}

export class RateLimitMiddleware implements JobMiddleware {
  private maxAttempts: number
  private decayMinutes: number
  private prefix: string

  constructor(maxAttempts: number, decayMinutes: number = 1, prefix = 'rate_limit') {
    this.maxAttempts = maxAttempts
    this.decayMinutes = decayMinutes
    this.prefix = prefix
  }

  async handle(job: JobContract, next: () => Promise<void>): Promise<void> {
    const key = this.getRateLimitKey(job)
    // In a real implementation, you'd check Redis for rate limiting
    // For now, we'll just pass through
    await next()
  }

  private getRateLimitKey(job: JobContract): string {
    const uniqueId = job.uniqueId?.() || 'default'
    return `${this.prefix}:${job.constructor.name}:${uniqueId}`
  }
}

export class UniqueJobMiddleware implements JobMiddleware {
  private ttl: number

  constructor(ttl: number = 3600) {
    this.ttl = ttl
  }

  async handle(job: JobContract, next: () => Promise<void>): Promise<void> {
    const uniqueId = job.uniqueId?.()
    if (!uniqueId) {
      return next()
    }

    const key = this.getUniqueKey(job, uniqueId)
    // In a real implementation, you'd check Redis for job uniqueness
    // For now, we'll just pass through
    await next()
  }

  private getUniqueKey(job: JobContract, uniqueId: string): string {
    return `unique_job:${job.constructor.name}:${uniqueId}`
  }
}

export class ThrottleMiddleware implements JobMiddleware {
  private allows: number
  private every: number
  private prefix: string

  constructor(allows: number, every: number, prefix = 'throttle') {
    this.allows = allows
    this.every = every
    this.prefix = prefix
  }

  async handle(job: JobContract, next: () => Promise<void>): Promise<void> {
    // In a real implementation, you'd implement throttling logic
    // For now, we'll just pass through
    await next()
  }
}

export class WithoutOverlappingMiddleware implements JobMiddleware {
  private ttl: number
  private releaseAfter: number

  constructor(ttl: number = 3600, releaseAfter: number = 3600) {
    this.ttl = ttl
    this.releaseAfter = releaseAfter
  }

  async handle(job: JobContract, next: () => Promise<void>): Promise<void> {
    const key = this.getOverlapKey(job)
    // In a real implementation, you'd use distributed locks to prevent overlapping
    // For now, we'll just pass through
    await next()
  }

  private getOverlapKey(job: JobContract): string {
    const uniqueId = job.uniqueId?.() || 'default'
    return `no_overlap:${job.constructor.name}:${uniqueId}`
  }
}

export class SkipIfMiddleware implements JobMiddleware {
  private condition: () => boolean | Promise<boolean>

  constructor(condition: () => boolean | Promise<boolean>) {
    this.condition = condition
  }

  async handle(job: JobContract, next: () => Promise<void>): Promise<void> {
    const shouldSkip = await this.condition()
    if (shouldSkip) {
      // Skip the job by not calling next()
      return
    }
    await next()
  }
}

export class FailureMiddleware implements JobMiddleware {
  private callback: (error: Error, job: JobContract) => Promise<void> | void

  constructor(callback: (error: Error, job: JobContract) => Promise<void> | void) {
    this.callback = callback
  }

  async handle(job: JobContract, next: () => Promise<void>): Promise<void> {
    try {
      await next()
    }
    catch (error) {
      await this.callback(error as Error, job)
      throw error
    }
  }
}

export const middleware = {
  rateLimit: (maxAttempts: number, decayMinutes?: number, prefix?: string) =>
    new RateLimitMiddleware(maxAttempts, decayMinutes, prefix),

  unique: (ttl?: number) =>
    new UniqueJobMiddleware(ttl),

  throttle: (allows: number, every: number, prefix?: string) =>
    new ThrottleMiddleware(allows, every, prefix),

  withoutOverlapping: (ttl?: number, releaseAfter?: number) =>
    new WithoutOverlappingMiddleware(ttl, releaseAfter),

  skipIf: (condition: () => boolean | Promise<boolean>) =>
    new SkipIfMiddleware(condition),

  onFailure: (callback: (error: Error, job: JobContract) => Promise<void> | void) =>
    new FailureMiddleware(callback),
}
