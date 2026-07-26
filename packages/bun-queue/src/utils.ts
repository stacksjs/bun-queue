import type { BackoffOptions, JobOptions, QueueConfig } from './types'
import { RedisClient } from 'bun'
import process from 'node:process'
import { config } from './config'

/**
 * Gets a Redis client from the config or creates a new one
 */
export function getRedisClient(queueConfig?: QueueConfig): RedisClient {
  const cfg = queueConfig || config

  if (cfg.redis?.client) {
    return cfg.redis.client
  }

  const url = cfg.redis?.url || process.env.REDIS_URL || 'redis://localhost:6379'
  return new RedisClient(url)
}

/**
 * Generates a unique job ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15)
}

/**
 * Merges job options with defaults
 */
export function mergeOptions(options?: JobOptions): JobOptions {
  return {
    ...config.defaultJobOptions,
    ...options,
  }
}

/**
 * Resolves a backoff setting into the delay, in milliseconds, to wait before
 * the next attempt.
 *
 * `attemptsMade` is the number of attempts that have already failed, so it is
 * 1 when the first attempt has just failed. An explicit per-attempt array is
 * indexed by that attempt (`backoff[attemptsMade - 1]`) and clamps to its last
 * entry once the schedule runs out, which is what makes `[1000, 5000]` mean
 * "1s, then 5s from here on" rather than "1s, 5s, then no wait at all".
 */
export function backoffDelay(backoff: BackoffOptions | undefined, attemptsMade: number): number {
  if (!backoff)
    return 0

  if (Array.isArray(backoff)) {
    if (backoff.length === 0)
      return 0

    const index = Math.min(Math.max(attemptsMade - 1, 0), backoff.length - 1)
    return Number(backoff[index]) || 0
  }

  if (backoff.type === 'exponential')
    return backoff.delay * 2 ** Math.max(attemptsMade - 1, 0)

  return backoff.delay
}

/**
 * Gets key with prefix
 */
export function getKey(key: string, prefix?: string): string {
  const keyPrefix = prefix || config.prefix
  return `${keyPrefix}:${key}`
}

/**
 * Parses Redis hash into a job
 */
export function parseJob(hash: Record<string, string>): any {
  if (!hash)
    return null

  const job = {
    ...hash,
    data: hash.data ? JSON.parse(hash.data) : {},
    opts: hash.opts ? JSON.parse(hash.opts) : {},
    progress: Number(hash.progress || 0),
    delay: Number(hash.delay || 0),
    timestamp: Number(hash.timestamp || 0),
    attemptsMade: Number(hash.attemptsMade || 0),
    stacktrace: hash.stacktrace ? JSON.parse(hash.stacktrace) : [],
    returnvalue: hash.returnvalue ? JSON.parse(hash.returnvalue) : null,
    finishedOn: hash.finishedOn ? Number(hash.finishedOn) : undefined,
    processedOn: hash.processedOn ? Number(hash.processedOn) : undefined,
    dependencies: hash.dependencies ? JSON.parse(hash.dependencies) : [],
  }

  return job
}

/**
 * Wait for the specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
