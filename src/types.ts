import type { RedisClient } from 'bun'

export interface QueueConfig {
  verbose: boolean
  redis?: {
    url?: string
    client?: RedisClient
  }
  prefix?: string
  defaultJobOptions?: JobOptions
  limiter?: RateLimiter
}

export type { RedisClient }

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused'

export interface JobOptions {
  delay?: number
  attempts?: number
  backoff?: {
    type: 'fixed' | 'exponential'
    delay: number
  }
  removeOnComplete?: boolean | number
  removeOnFail?: boolean | number
  priority?: number
  lifo?: boolean
  timeout?: number
  jobId?: string
  repeat?: {
    every: number
    limit?: number
    count?: number
    cron?: string
    tz?: string
    startDate?: Date | number
    endDate?: Date | number
  }
}

export interface RateLimiter {
  max: number
  duration: number
}

export interface Job<T = any> {
  id: string
  name: string
  data: T
  opts: JobOptions
  progress: number
  delay: number
  timestamp: number
  attemptsMade: number
  stacktrace: string[]
  returnvalue: any
  finishedOn?: number
  processedOn?: number
  failedReason?: string
}
