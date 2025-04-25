import type { RedisClient } from 'bun'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'

export interface QueueConfig {
  verbose?: boolean
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
  distributedLock?: boolean
  defaultDeadLetterOptions?: DeadLetterQueueOptions // Default dead letter queue options
  horizontalScaling?: {
    enabled?: boolean
    instanceId?: string
    maxWorkersPerInstance?: number
    jobsPerWorker?: number
    leaderElection?: {
      heartbeatInterval?: number
      leaderTimeout?: number
    }
    workCoordination?: {
      pollInterval?: number
      keyPrefix?: string
    }
  }
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
  deadLetter?: boolean | DeadLetterQueueOptions // Whether to use dead letter queue for this job
}

export interface RateLimiter {
  max: number
  duration: number
  keyPrefix?: string | ((data: any) => string)
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
  batchAdded: (batchId: string, jobIds: string[]) => void
  batchCompleted: (batchId: string, results: any[]) => void
  batchFailed: (batchId: string, errors: Error[]) => void
  batchProgress: (batchId: string, progress: number) => void
  groupCreated: (groupName: string) => void
  groupRemoved: (groupName: string) => void
  observableStarted: (observableId: string) => void
  observableStopped: (observableId: string) => void
  jobMovedToDeadLetter: (jobId: string, deadLetterQueueName: string, reason: string) => void
  jobRepublishedFromDeadLetter: (jobId: string, originalQueueName: string) => void
}

// Batch processing types
export interface BatchOptions extends JobOptions {
  batchSize?: number
  processTimeout?: number
}

export interface Batch<T = any> {
  id: string
  jobs: Job<T>[]
  opts: BatchOptions
  timestamp: number
  status: JobStatus
  processingAt?: number
  finishedAt?: number
}

// Group types
export interface GroupOptions {
  name: string
  limit?: number
  maxConcurrency?: number
}

export interface Group {
  name: string
  limit: number
  maxConcurrency: number
  queues: string[]
}

// Observable types
export interface ObservableOptions {
  interval?: number
  autoStart?: boolean
}

export interface Observable {
  id: string
  queues: string[]
  interval: number
  running: boolean
}

// Priority Queue types
export type PriorityLevel = number
export const DEFAULT_PRIORITY_LEVEL = 0
export const MAX_PRIORITY_LEVELS = 10 // Support 0-9 priority levels by default

export interface PriorityQueueOptions {
  levels?: number // Number of priority levels to support
  defaultLevel?: number // Default priority level
  dynamicReordering?: boolean // Whether to allow dynamic reordering of jobs
  reorderInterval?: number // Interval in ms to check for reordering
}

// Dead Letter Queue options
export interface DeadLetterQueueOptions {
  queueSuffix?: string // Suffix to append to the queue name for the dead letter queue, defaults to '-dead-letter'
  maxRetries?: number // Maximum number of retries before moving to dead letter queue, defaults to 3
  processFailed?: boolean // Whether to automatically process failed jobs, defaults to false
  removeFromOriginalQueue?: boolean // Whether to remove the job from the original queue's failed list, defaults to true
  enabled?: boolean // Whether the dead letter queue is enabled by default, defaults to false
}
