import axios from 'axios'

// Create a configured axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Mock data for development (will be replaced with real API calls)
const mockStats = {
  activeQueues: 3,
  waitingJobs: 25,
  activeJobs: 8,
  completedJobs: 142,
  failedJobs: 5,
}

const mockQueues = [
  {
    id: 'q1',
    name: 'email-notifications',
    status: 'active',
    jobCount: 15,
    workerCount: 3,
    processedCount: 58,
    failedCount: 2,
  },
  {
    id: 'q2',
    name: 'user-sync',
    status: 'active',
    jobCount: 10,
    workerCount: 2,
    processedCount: 47,
    failedCount: 1,
  },
  {
    id: 'q3',
    name: 'data-processing',
    status: 'active',
    jobCount: 8,
    workerCount: 3,
    processedCount: 37,
    failedCount: 2,
  },
]

const mockJobs = [
  {
    id: 'job1',
    name: 'email-notifications',
    status: 'completed',
    data: { type: 'welcome', recipient: 'user@example.com' },
    progress: 100,
    timestamp: Date.now() - 3600000,
    processedOn: Date.now() - 3590000,
    finishedOn: Date.now() - 3585000,
    attemptsMade: 1,
  },
  {
    id: 'job2',
    name: 'email-notifications',
    status: 'waiting',
    data: { type: 'reset', recipient: 'user2@example.com' },
    progress: 0,
    timestamp: Date.now() - 1800000,
    attemptsMade: 0,
  },
  {
    id: 'job3',
    name: 'user-sync',
    status: 'active',
    data: { userId: '123', action: 'update' },
    progress: 45,
    timestamp: Date.now() - 1200000,
    processedOn: Date.now() - 1180000,
    attemptsMade: 1,
  },
  {
    id: 'job4',
    name: 'data-processing',
    status: 'failed',
    data: { fileId: 'file123', operation: 'transform' },
    progress: 72,
    timestamp: Date.now() - 7200000,
    processedOn: Date.now() - 7150000,
    attemptsMade: 3,
  },
]

// Generate mock metrics data
function generateMockMetrics(timeRange: string) {
  let dataPoints = 24
  let interval = 60 * 60 * 1000 // 1 hour in milliseconds

  if (timeRange === '7d') {
    dataPoints = 7
    interval = 24 * 60 * 60 * 1000 // 1 day in milliseconds
  }
  else if (timeRange === '30d') {
    dataPoints = 30
    interval = 24 * 60 * 60 * 1000 // 1 day in milliseconds
  }

  const now = Date.now()
  const throughput = []
  const latency = []
  const errorRate = []

  for (let i = dataPoints - 1; i >= 0; i--) {
    const time = new Date(now - (i * interval))
    const timeString = time.toISOString()

    // Generate some realistic-looking metrics
    throughput.push({
      time: timeString,
      value: Math.floor(Math.random() * 50) + 20,
    })

    latency.push({
      time: timeString,
      value: Math.floor(Math.random() * 500) + 100,
    })

    errorRate.push({
      time: timeString,
      value: Math.floor(Math.random() * 5),
    })
  }

  return {
    throughput,
    latency,
    errorRate,
  }
}

export const QueueService = {
  /**
   * Get queue statistics
   */
  async getStats() {
    try {
      // In a real app, this would be:
      // const response = await api.get('/stats')
      // return response.data

      // Simulating API call latency
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockStats
    }
    catch (error) {
      console.error('API error getting stats:', error)
      throw error
    }
  },

  /**
   * Get all queues
   */
  async getQueues() {
    try {
      // In a real app, this would be:
      // const response = await api.get('/queues')
      // return response.data

      // Simulating API call latency
      await new Promise(resolve => setTimeout(resolve, 700))
      return mockQueues
    }
    catch (error) {
      console.error('API error getting queues:', error)
      throw error
    }
  },

  /**
   * Get all jobs
   */
  async getJobs() {
    try {
      // In a real app, this would be:
      // const response = await api.get('/jobs')
      // return response.data

      // Simulating API call latency
      await new Promise(resolve => setTimeout(resolve, 800))
      return mockJobs
    }
    catch (error) {
      console.error('API error getting jobs:', error)
      throw error
    }
  },

  /**
   * Get metrics data
   */
  async getMetrics(timeRange: string) {
    try {
      // In a real app, this would be:
      // const response = await api.get(`/metrics?timeRange=${timeRange}`)
      // return response.data

      // Simulating API call latency
      await new Promise(resolve => setTimeout(resolve, 900))
      return generateMockMetrics(timeRange)
    }
    catch (error) {
      console.error('API error getting metrics:', error)
      throw error
    }
  },
}
