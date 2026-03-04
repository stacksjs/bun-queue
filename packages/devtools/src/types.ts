// Re-export all types from the types folder for backwards compatibility
export type {
  DashboardConfig,
  RedisConfig,
  AuthConfig,
  DashboardStats,
} from './types/dashboard'

export type {
  JobData,
} from './types/job'

export {
  JobStatus,
} from './types/job'

export type {
  Queue,
  QueueDetail,
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
  DependencyNode as JobNode,
  DependencyLink,
  DependencyGraph,
  DependencyGraph as JobDependencyGraph,
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

export type {
  StatVariant,
  QueueStatusData,
  JobTableRow,
} from './types/components'
