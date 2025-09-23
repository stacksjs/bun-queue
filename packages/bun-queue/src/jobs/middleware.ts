import type { JobContract as Job, JobMiddleware } from '../job-base'

export class RateLimited implements JobMiddleware {
  constructor(
    private key: string,
    private maxAttempts: number,
    private decaySeconds: number = 60,
  ) {}

  async handle(job: Job, next: () => Promise<void>): Promise<void> {
    // In a real implementation, this would check Redis for rate limiting
    // For now, we'll just pass through
    console.log(`[RateLimited] Checking rate limit for ${this.key}`)
    await next()
  }

  static by(key: string, maxAttempts: number, decaySeconds: number = 60): RateLimited {
    return new RateLimited(key, maxAttempts, decaySeconds)
  }
}

export class WithoutOverlapping implements JobMiddleware {
  constructor(
    private key?: string,
    private releaseAfterSeconds: number = 3600,
    private expireAfterSeconds: number = 3600,
  ) {}

  async handle(job: Job, next: () => Promise<void>): Promise<void> {
    const lockKey = this.key || job.uniqueId?.() || (job as any).constructor.name
    console.log(`[WithoutOverlapping] Acquiring lock for ${lockKey}`)

    // In a real implementation, this would use distributed locks
    // For now, we'll just pass through
    await next()
  }

  static by(key: string): WithoutOverlapping {
    return new WithoutOverlapping(key)
  }

  releaseAfter(seconds: number): this {
    this.releaseAfterSeconds = seconds
    return this
  }

  expireAfter(seconds: number): this {
    this.expireAfterSeconds = seconds
    return this
  }
}

export class SkipIfBatchCancelled implements JobMiddleware {
  async handle(job: Job, next: () => Promise<void>): Promise<void> {
    // Check if the batch is cancelled
    if ('batchId' in job && job.batchId) {
      // In a real implementation, check batch status from storage
      console.log(`[SkipIfBatchCancelled] Checking batch ${job.batchId} status`)
    }

    await next()
  }
}

export class ThrottlesExceptions implements JobMiddleware {
  constructor(
    private maxAttempts: number = 10,
    private decaySeconds: number = 600,
    private by?: (job: Job) => string,
  ) {}

  async handle(job: Job, next: () => Promise<void>): Promise<void> {
    const key = this.by ? this.by(job) : (job as any).constructor.name

    try {
      await next()
    }
    catch (error) {
      console.log(`[ThrottlesExceptions] Exception throttled for ${key}`)
      // In a real implementation, track exceptions in Redis
      throw error
    }
  }

  static by(callback: (job: Job) => string, maxAttempts: number = 10, decaySeconds: number = 600): ThrottlesExceptions {
    return new ThrottlesExceptions(maxAttempts, decaySeconds, callback)
  }
}

// Job middleware factory
export const Middleware = {
  rateLimited: (key: string, maxAttempts: number, decaySeconds?: number) =>
    new RateLimited(key, maxAttempts, decaySeconds),

  withoutOverlapping: (key?: string, releaseAfterSeconds?: number, expireAfterSeconds?: number) =>
    new WithoutOverlapping(key, releaseAfterSeconds, expireAfterSeconds),

  skipIfBatchCancelled: () => new SkipIfBatchCancelled(),

  throttlesExceptions: (maxAttempts?: number, decaySeconds?: number, by?: (job: Job) => string) =>
    new ThrottlesExceptions(maxAttempts, decaySeconds, by),
}
