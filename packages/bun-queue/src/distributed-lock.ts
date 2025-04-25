import type { RedisClient } from 'bun'
import { createLogger } from './logger'
import { generateId } from './utils'

export interface LockOptions {
  /**
   * Lock duration in milliseconds (defaults to 30000 ms / 30 seconds)
   */
  duration?: number

  /**
   * Whether to automatically extend the lock as it approaches expiration (defaults to true)
   */
  autoExtend?: boolean

  /**
   * How often to extend the lock (defaults to 2/3 of the duration)
   */
  extendInterval?: number

  /**
   * Number of retries to acquire the lock if it's already locked (defaults to 0)
   */
  retries?: number

  /**
   * Delay between retries in milliseconds (defaults to 100ms)
   */
  retryDelay?: number
}

/**
 * Distributed lock implementation using Redis
 */
export class DistributedLock {
  private redisClient: RedisClient
  private prefix: string
  private readonly logger = createLogger('lock')

  constructor(redisClient: RedisClient, prefix = 'lock') {
    this.redisClient = redisClient
    this.prefix = prefix
  }

  /**
   * Acquire a lock
   * @param resource The resource to lock
   * @param options Lock options
   * @returns Lock token if successfully acquired, null otherwise
   */
  async acquire(resource: string, options: LockOptions = {}): Promise<string | null> {
    const lockKey = this.getLockKey(resource)
    const token = generateId()
    const duration = options.duration || 30000 // Default 30 seconds
    const retries = options.retries || 0
    const retryDelay = options.retryDelay || 100

    // Try to acquire the lock
    for (let attempt = 0; attempt <= retries; attempt++) {
      // Use SET NX (only set if key doesn't exist) with expiration
      const result = await this.redisClient.send('SET', [
        lockKey,
        token,
        'NX', // Only set if key doesn't exist
        'PX', // Set expiry in milliseconds
        duration.toString(),
      ])

      if (result === 'OK') {
        this.logger.debug(`Acquired lock ${resource} with token ${token}`)

        // Set up auto-extension if enabled
        if (options.autoExtend !== false) {
          const extendInterval = options.extendInterval || Math.floor(duration * 2 / 3)
          this.setupAutoExtend(resource, token, duration, extendInterval)
        }

        return token
      }

      // If not successful and we have retries left
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    this.logger.debug(`Failed to acquire lock ${resource} after ${retries + 1} attempts`)
    return null
  }

  /**
   * Release a lock
   * @param resource The resource to unlock
   * @param token The lock token for validation
   * @returns True if successfully released, false otherwise
   */
  async release(resource: string, token: string): Promise<boolean> {
    const lockKey = this.getLockKey(resource)

    // We need to implement the Lua script logic with normal Redis commands
    // since we can't use eval directly

    // First, check if we own the lock
    const currentToken = await this.redisClient.get(lockKey)

    if (currentToken === token) {
      // We own the lock, so delete it
      await this.redisClient.del(lockKey)
      this.logger.debug(`Released lock ${resource} with token ${token}`)
      return true
    }
    else {
      this.logger.debug(`Failed to release lock ${resource} with token ${token}`)
      return false
    }
  }

  /**
   * Check if a lock exists without acquiring it
   * @param resource The resource to check
   * @returns True if locked, false otherwise
   */
  async isLocked(resource: string): Promise<boolean> {
    const lockKey = this.getLockKey(resource)
    const result = await this.redisClient.exists(lockKey)
    // Different Redis clients may return different types
    return !!result
  }

  /**
   * Extend a lock's duration
   * @param resource The resource to extend
   * @param token The lock token for validation
   * @param duration New duration in milliseconds
   * @returns True if successfully extended, false otherwise
   */
  async extend(resource: string, token: string, duration: number): Promise<boolean> {
    const lockKey = this.getLockKey(resource)

    // Implement Lua script logic with standard Redis commands
    const currentToken = await this.redisClient.get(lockKey)

    if (currentToken === token) {
      // We own the lock, so extend it
      const result = await this.redisClient.send('PEXPIRE', [lockKey, duration.toString()])

      if (result === 1 || result === true) {
        this.logger.debug(`Extended lock ${resource} with token ${token} for ${duration}ms`)
        return true
      }
    }

    this.logger.debug(`Failed to extend lock ${resource} with token ${token}`)
    return false
  }

  /**
   * Set up automatic lock extension
   */
  private setupAutoExtend(resource: string, token: string, duration: number, interval: number): void {
    const autoExtendId = setInterval(async () => {
      try {
        const extended = await this.extend(resource, token, duration)

        if (!extended) {
          // Lock no longer exists or we don't own it anymore
          clearInterval(autoExtendId)
          this.logger.debug(`Stopped auto-extension for lock ${resource}`)
        }
      }
      catch (error) {
        this.logger.error(`Error extending lock ${resource}: ${(error as Error).message}`)
        clearInterval(autoExtendId)
      }
    }, interval)

    // Ensure we clean up the interval when Node exits
    const resourceKey = `${resource}:${token}`
    if (typeof process !== 'undefined') {
      const extendTimers = DistributedLock.autoExtendTimers
      extendTimers.set(resourceKey, autoExtendId)

      // Cleanup on first timer
      if (extendTimers.size === 1) {
        process.once('exit', () => {
          for (const timer of extendTimers.values()) {
            clearInterval(timer)
          }
          extendTimers.clear()
        })
      }
    }
  }

  /**
   * Get the lock key with prefix
   */
  private getLockKey(resource: string): string {
    return `${this.prefix}:${resource}`
  }

  /**
   * Store interval timers for cleanup
   */
  private static autoExtendTimers = new Map<string, NodeJS.Timeout>()

  /**
   * Execute a function with a lock
   * @param resource The resource to lock
   * @param fn The function to execute while holding the lock
   * @param options Lock options
   * @returns The result of the function
   * @throws Error if the lock cannot be acquired
   */
  async withLock<T>(resource: string, fn: () => Promise<T>, options: LockOptions = {}): Promise<T> {
    const token = await this.acquire(resource, options)

    if (!token) {
      throw new Error(`Failed to acquire lock for resource ${resource}`)
    }

    try {
      return await fn()
    }
    finally {
      await this.release(resource, token)
    }
  }
}
