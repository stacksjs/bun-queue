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
