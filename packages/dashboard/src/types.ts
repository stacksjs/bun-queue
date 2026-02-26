export interface DashboardConfig {
  port?: number
  host?: string
  redis?: RedisConfig
  auth?: AuthConfig
  refreshInterval?: number
}

export interface RedisConfig {
  host?: string
  port?: number
  password?: string
  db?: number
  prefix?: string
}

export interface AuthConfig {
  enabled?: boolean
  username?: string
  password?: string
}

export interface QueueMetrics {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: boolean
  throughput: number
  errorRate: number
  avgProcessingTime: number
}

export interface JobData {
  id: string
  queue: string
  name: string
  status: JobStatus
  data: Record<string, unknown>
  result?: unknown
  error?: string
  attempts: number
  maxAttempts: number
  createdAt: string
  processedAt?: string
  completedAt?: string
  failedAt?: string
  duration?: number
}

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'

export interface DashboardStats {
  totalQueues: number
  totalJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
  throughputPerMinute: number
  avgLatency: number
  uptime: number
}
