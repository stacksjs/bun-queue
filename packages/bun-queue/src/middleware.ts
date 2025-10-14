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

    const redisClient = job.job?.queue?.redisClient
    if (!redisClient) {
      // If no Redis client available, just pass through
      return next()
    }

    const ttl = this.decayMinutes * 60

    // Increment the counter
    const current = await redisClient.incr(key)

    // Set expiration on first increment
    if (current === 1) {
      await redisClient.expire(key, ttl)
    }

    // Check if rate limit exceeded
    if (current > this.maxAttempts) {
      const remaining = await redisClient.ttl(key)
      throw new Error(
        `Rate limit exceeded for ${job.constructor.name}. `
        + `Max ${this.maxAttempts} attempts per ${this.decayMinutes} minute(s). `
        + `Try again in ${remaining} seconds.`,
      )
    }

    // Proceed with job execution
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

    // Get Redis client from the job's queue instance
    const redisClient = job.job?.queue?.redisClient
    if (!redisClient) {
      // If no Redis client available, just pass through
      return next()
    }

    try {
      // Try to set a lock key with NX (only if not exists) and EX (expiration)
      const lockAcquired = await redisClient.set(key, '1', {
        NX: true,
        EX: this.ttl,
      })

      if (!lockAcquired) {
        // Job with this unique ID is already queued/processing
        throw new Error(`Job with unique ID "${uniqueId}" is already queued or being processed`)
      }

      // Job is unique, proceed with execution
      try {
        await next()
      }
      finally {
        // Release the lock after job completion (successful or failed)
        await redisClient.del(key)
      }
    }
    catch (error) {
      // If it's our uniqueness error, rethrow it
      if (error instanceof Error && error.message.includes('already queued')) {
        throw error
      }
      // For other errors, still try to clean up the lock
      try {
        await redisClient.del(key)
      }
      catch {
        // Ignore cleanup errors
      }
      throw error
    }
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
    const key = this.getThrottleKey(job)

    const redisClient = job.job?.queue?.redisClient
    if (!redisClient) {
      // If no Redis client available, just pass through
      return next()
    }

    const ttl = Math.ceil(this.every / 1000) // Convert ms to seconds

    // Get current count
    const current = await redisClient.incr(key)

    // Set expiration on first increment
    if (current === 1) {
      await redisClient.expire(key, ttl)
    }

    // Check if throttle limit exceeded
    if (current > this.allows) {
      const remaining = await redisClient.ttl(key)
      throw new Error(
        `Throttle limit exceeded for ${job.constructor.name}. `
        + `Max ${this.allows} jobs per ${this.every}ms. `
        + `Try again in ${remaining} seconds.`,
      )
    }

    // Proceed with job execution
    await next()
  }

  private getThrottleKey(job: JobContract): string {
    const uniqueId = job.uniqueId?.() || 'default'
    return `${this.prefix}:${job.constructor.name}:${uniqueId}`
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

    const redisClient = job.job?.queue?.redisClient
    if (!redisClient) {
      // If no Redis client available, just pass through
      return next()
    }

    try {
      // Try to acquire a lock
      const lockAcquired = await redisClient.set(key, Date.now().toString(), {
        NX: true,
        EX: this.ttl,
      })

      if (!lockAcquired) {
        // Another instance of this job is already running
        throw new Error(
          `Job ${job.constructor.name} is already running. `
          + `Cannot execute overlapping instances.`,
        )
      }

      // Job can proceed
      try {
        await next()
      }
      finally {
        // Release the lock after completion
        // Use a delay if releaseAfter is specified
        if (this.releaseAfter > 0) {
          await redisClient.expire(key, this.releaseAfter)
        }
        else {
          await redisClient.del(key)
        }
      }
    }
    catch (error) {
      // If it's our overlapping error, rethrow it
      if (error instanceof Error && error.message.includes('already running')) {
        throw error
      }
      // For other errors, clean up the lock
      try {
        await redisClient.del(key)
      }
      catch {
        // Ignore cleanup errors
      }
      throw error
    }
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

  async handle(_job: JobContract, next: () => Promise<void>): Promise<void> {
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
  rateLimit: (maxAttempts: number, decayMinutes?: number, prefix?: string): RateLimitMiddleware =>
    new RateLimitMiddleware(maxAttempts, decayMinutes, prefix),

  unique: (ttl?: number): UniqueJobMiddleware =>
    new UniqueJobMiddleware(ttl),

  throttle: (allows: number, every: number, prefix?: string): ThrottleMiddleware =>
    new ThrottleMiddleware(allows, every, prefix),

  withoutOverlapping: (ttl?: number, releaseAfter?: number): WithoutOverlappingMiddleware =>
    new WithoutOverlappingMiddleware(ttl, releaseAfter),

  skipIf: (condition: () => boolean | Promise<boolean>): SkipIfMiddleware =>
    new SkipIfMiddleware(condition),

  onFailure: (callback: (error: Error, job: JobContract) => Promise<void> | void): FailureMiddleware =>
    new FailureMiddleware(callback),
}
