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

export interface Queue {
  id: string
  name: string
  status: string
  jobCount: number
  pendingJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
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

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}

export interface JobNode {
  id: string
  name: string
  status: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface JobDependencyLink {
  source: string
  target: string
}

export interface JobDependencyGraph {
  nodes: JobNode[]
  links: JobDependencyLink[]
}

export interface JobGroup {
  id: string
  name: string
  jobCount: number
  activeJobs: number
  waitingJobs: number
  completedJobs: number
  failedJobs: number
  createdAt: string
  updatedAt: string
}

export interface Batch {
  id: string
  name: string
  totalJobs: number
  pendingJobs: number
  processedJobs: number
  failedJobs: number
  progress: number
  status: string
  createdAt: string
  finishedAt?: string
}

export interface QueueStats {
  activeQueues: number
  waitingJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
  processingRate: number
}

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

export interface MetricsData {
  throughput: number[]
  latency: number[]
  errorRate: number[]
  timestamps: string[]
}

export interface MetricsPoint {
  time: string
  value: number
}
