import { QueueService } from '@/api/queueService'
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface QueueStats {
  activeQueues: number
  waitingJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
}

interface Queue {
  id: string
  name: string
  status: string
  jobCount: number
  workerCount: number
  processedCount: number
  failedCount: number
}

interface Job {
  id: string
  name: string
  status: string
  data: any
  progress: number
  timestamp: number
  processedOn?: number
  finishedOn?: number
  attemptsMade: number
}

interface MetricsData {
  throughput: Array<{ time: string, value: number }>
  latency: Array<{ time: string, value: number }>
  errorRate: Array<{ time: string, value: number }>
}

export const useQueueStore = defineStore('queue', () => {
  const stats = ref<QueueStats>({
    activeQueues: 0,
    waitingJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
  })

  const queues = ref<Queue[]>([])
  const jobs = ref<Job[]>([])
  const metrics = ref<MetricsData>({
    throughput: [],
    latency: [],
    errorRate: [],
  })

  // Fetch overall queue statistics
  const fetchQueueStats = async () => {
    try {
      const data = await QueueService.getStats()
      stats.value = data
    }
    catch (error) {
      console.error('Failed to fetch queue stats:', error)
      throw error
    }
  }

  // Fetch all queues
  const fetchQueues = async () => {
    try {
      const data = await QueueService.getQueues()
      queues.value = data
    }
    catch (error) {
      console.error('Failed to fetch queues:', error)
      throw error
    }
  }

  // Fetch all jobs
  const fetchJobs = async () => {
    try {
      const data = await QueueService.getJobs()
      jobs.value = data
    }
    catch (error) {
      console.error('Failed to fetch jobs:', error)
      throw error
    }
  }

  // Fetch performance metrics
  const fetchMetrics = async (timeRange: string) => {
    try {
      const data = await QueueService.getMetrics(timeRange)
      metrics.value = data
    }
    catch (error) {
      console.error('Failed to fetch metrics:', error)
      throw error
    }
  }

  return {
    stats,
    queues,
    jobs,
    metrics,
    fetchQueueStats,
    fetchQueues,
    fetchJobs,
    fetchMetrics,
  }
})
