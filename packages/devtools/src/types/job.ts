export interface JobData {
  id: string
  queue: string
  name: string
  status: string
  data: Record<string, unknown>
  result?: unknown
  error?: string | Record<string, unknown>
  attempts: number
  maxAttempts: number
  createdAt: string
  processedAt?: string
  completedAt?: string
  failedAt?: string
  updatedAt?: string
  duration?: number
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}
