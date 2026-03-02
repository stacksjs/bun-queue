export interface Batch {
  id: string
  name: string
  totalJobs?: number
  total?: number
  pendingJobs?: number
  processedJobs?: number
  processed?: number
  failedJobs?: number
  failed?: number
  progress: number
  status: string
  createdAt: string
  startedAt?: string
  finishedAt?: string
}
