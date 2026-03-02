export type StatVariant = 'active' | 'completed' | 'failed' | ''

export interface QueueStatusData {
  name: string
  paused: boolean
  waiting: number
  active: number
  completed: number
  failed: number
}

export interface JobTableRow {
  id: string
  queue: string
  name: string
  status: string
  attempts: number
  maxAttempts: number
  createdAt: string
  duration?: number
}
