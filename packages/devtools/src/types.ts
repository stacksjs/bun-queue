// Re-export all types from the types folder for backwards compatibility
export type {
  DashboardConfig,
  RedisConfig,
  AuthConfig,
  DashboardStats,
} from './types/dashboard'

export type {
  JobData,
  JobStatus,
} from './types/job'

export type {
  Queue,
  QueueMetrics,
  QueueStats,
  StatusBadgeInfo,
} from './types/queue'

export type {
  Batch,
} from './types/batch'

export type {
  JobGroup,
} from './types/group'

export type {
  DependencyNode,
  DependencyLink,
  DependencyGraph,
} from './types/dependency'

export type {
  MetricsData,
  MetricsPoint,
  ThroughputData,
} from './types/metrics'

export type {
  EventTemplate,
  MonitoringEvent,
} from './types/monitoring'
