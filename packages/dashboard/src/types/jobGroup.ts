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
