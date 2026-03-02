export interface JobGroup {
  id: string
  name: string
  jobCount?: number
  total?: number
  activeJobs?: number
  active?: number
  waitingJobs?: number
  waiting?: number
  completedJobs?: number
  completed?: number
  failedJobs?: number
  failed?: number
  createdAt: string
  updatedAt: string
}
