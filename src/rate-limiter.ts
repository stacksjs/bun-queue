import type { Queue } from './queue'
import type { RateLimiter as RateLimiterOptions } from './types'

export interface RateLimitResult {
  limited: boolean
  remaining: number
  resetIn: number
}

export class RateLimiter {
  queue: Queue
  options: RateLimiterOptions

  constructor(queue: Queue, options: RateLimiterOptions) {
    this.queue = queue
    this.options = options
  }

  /**
   * Check if the rate limit has been exceeded
   */
  async check(): Promise<RateLimitResult> {
    const key = this.queue.getKey('limit')
    const now = Date.now()

    const result = await this.queue.redisClient.send('rateLimit', [
      key,
      this.queue.name,
      this.options.max.toString(),
      this.options.duration.toString(),
      now.toString(),
    ])

    return {
      limited: result[0] === 1,
      remaining: result[1],
      resetIn: result[2],
    }
  }
}
