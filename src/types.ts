import type { RedisClient } from 'bun'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

export interface QueueConfig {
  verbose: boolean
  logLevel?: LogLevel
  redis?: {
    url?: string
    client?: RedisClient
  }
  prefix?: string
  defaultJobOptions?: JobOptions
  limiter?: RateLimiter
  metrics?: {
    enabled: boolean
    collectInterval?: number
  }
  stalledJobCheckInterval?: number
  maxStalledJobRetries?: number
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
  dependsOn?: string | string[]
  keepJobs?: boolean
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
  dependencies?: string[]
}

export interface QueueEvents {
  jobAdded: (jobId: string, name: string) => void
  jobRemoved: (jobId: string) => void
  jobCompleted: (jobId: string, result: any) => void
  jobFailed: (jobId: string, error: Error) => void
  jobProgress: (jobId: string, progress: number) => void
  jobActive: (jobId: string) => void
  jobStalled: (jobId: string) => void
  jobDelayed: (jobId: string, delay: number) => void
  ready: () => void
  error: (error: Error) => void
}
