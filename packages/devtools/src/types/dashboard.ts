export interface DashboardConfig {
  port?: number
  host?: string
  redis?: RedisConfig
  auth?: AuthConfig
  refreshInterval?: number
  /** Port for the WebSocket broadcast server (default: 6001) */
  broadcastPort?: number
  /** Pass an existing QueueManager instance to read real queue data */
  queueManager?: any
  /** Pass Queue instances directly (alternative to queueManager) */
  queues?: any[]
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
