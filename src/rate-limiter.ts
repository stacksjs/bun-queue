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
  async check(data?: any): Promise<RateLimitResult> {
    const key = this.queue.getKey('limit')
    const now = Date.now()

    // Determine the identifier based on keyPrefix if provided
    let identifier = this.queue.name

    if (this.options.keyPrefix && data) {
      if (typeof this.options.keyPrefix === 'function') {
        // Use the function to generate a key from the data
        const keyValue = this.options.keyPrefix(data)
        identifier = `${this.queue.name}:${keyValue}`
      }
      else {
        // Use the keyPrefix as a property path in the data object
        const keyValue = data[this.options.keyPrefix]
        if (keyValue) {
          identifier = `${this.queue.name}:${keyValue}`
        }
      }
    }

    const result = await this.queue.redisClient.send('rateLimit', [
      key,
      identifier,
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

  /**
   * Check if the rate limit has been exceeded for a specific key
   */
  async checkByKey(key: string): Promise<RateLimitResult> {
    const identifier = `${this.queue.name}:${key}`
    const limitKey = this.queue.getKey('limit')
    const now = Date.now()

    const result = await this.queue.redisClient.send('rateLimit', [
      limitKey,
      identifier,
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
