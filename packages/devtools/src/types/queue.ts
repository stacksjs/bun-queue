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

export interface QueueStats {
  activeQueues: number
  waitingJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
  processingRate: number
}

export interface StatusBadgeInfo {
  cls: string
  label: string
}
