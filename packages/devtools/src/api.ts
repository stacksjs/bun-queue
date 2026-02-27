import type { Batch, DashboardConfig, DashboardStats, JobData, JobDependencyGraph, JobGroup, MetricsData, Queue, QueueMetrics } from './types'
import { JobStatus } from './types'

const defaultConfig: Required<Pick<DashboardConfig, 'port' | 'host' | 'refreshInterval'>> = {
  port: 4400,
  host: 'localhost',
  refreshInterval: 5000,
}

export function resolveConfig(config: DashboardConfig): DashboardConfig & typeof defaultConfig {
  return { ...defaultConfig, ...config }
}

// ---------------------------------------------------------------------------
// Mock Data (ported from Vue devtools queueStore + queueService)
// ---------------------------------------------------------------------------

const mockQueues: Queue[] = [
  {
    id: 'queue_email',
    name: 'Email Queue',
    status: 'active',
    jobCount: 254,
    pendingJobs: 48,
    activeJobs: 6,
    completedJobs: 197,
    failedJobs: 3,
  },
  {
    id: 'queue_image',
    name: 'Image Processing',
    status: 'active',
    jobCount: 178,
    pendingJobs: 32,
    activeJobs: 8,
    completedJobs: 135,
    failedJobs: 3,
  },
  {
    id: 'queue_data',
    name: 'Data Import',
    status: 'paused',
    jobCount: 87,
    pendingJobs: 42,
    activeJobs: 0,
    completedJobs: 43,
    failedJobs: 2,
  },
  {
    id: 'queue_report',
    name: 'Report Generation',
    status: 'active',
    jobCount: 112,
    pendingJobs: 15,
    activeJobs: 2,
    completedJobs: 92,
    failedJobs: 3,
  },
  {
    id: 'queue_notification',
    name: 'Push Notifications',
    status: 'active',
    jobCount: 329,
    pendingJobs: 24,
    activeJobs: 5,
    completedJobs: 300,
    failedJobs: 0,
  },
  {
    id: 'queue_backup',
    name: 'Database Backup',
    status: 'active',
    jobCount: 42,
    pendingJobs: 0,
    activeJobs: 1,
    completedJobs: 41,
    failedJobs: 0,
  },
  {
    id: 'queue_analytics',
    name: 'Analytics Processing',
    status: 'stopped',
    jobCount: 56,
    pendingJobs: 56,
    activeJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
  },
]

const mockJobs: JobData[] = [
  {
    id: 'job_1a2b3c',
    name: 'Send Welcome Email',
    status: JobStatus.COMPLETED,
    queue: 'Email Queue',
    createdAt: '2023-10-15 09:15:22',
    processedAt: '2023-10-15 09:15:30',
    completedAt: '2023-10-15 09:15:45',
    data: { recipient: 'john.doe@example.com', template: 'welcome_template', sent: true, subject: 'Welcome to Our Platform', deliveryStatus: 'delivered', openedAt: '2023-10-15 10:22:15' },
    attempts: 1,
    maxAttempts: 3,
    duration: 23000,
  },
  {
    id: 'job_2b3c4d',
    name: 'Send Password Reset',
    status: JobStatus.ACTIVE,
    queue: 'Email Queue',
    createdAt: '2023-10-15 11:42:10',
    processedAt: '2023-10-15 11:42:15',
    data: { recipient: 'sarah.smith@example.com', template: 'password_reset', sent: false },
    attempts: 1,
    maxAttempts: 3,
  },
  {
    id: 'job_3c4d5e',
    name: 'Process Profile Picture',
    status: JobStatus.ACTIVE,
    queue: 'Image Processing',
    createdAt: '2023-10-15 10:30:00',
    processedAt: '2023-10-15 10:30:12',
    data: { user_id: 'user_789', file_size: '2.4MB', formats: ['jpg', 'webp', 'thumbnail'] },
    attempts: 1,
    maxAttempts: 3,
  },
  {
    id: 'job_4d5e6f',
    name: 'Process Product Images',
    status: JobStatus.WAITING,
    queue: 'Image Processing',
    createdAt: '2023-10-15 11:05:30',
    data: { product_id: 'prod_456', image_count: 5, formats: ['jpg', 'webp', 'thumbnail'] },
    attempts: 0,
    maxAttempts: 3,
  },
  {
    id: 'job_5e6f7g',
    name: 'Import Customer Data',
    status: JobStatus.WAITING,
    queue: 'Data Import',
    createdAt: '2023-10-15 11:45:00',
    data: { source: 'CSV Upload', records: 1250, file_name: 'customers_oct_2023.csv' },
    attempts: 0,
    maxAttempts: 3,
  },
  {
    id: 'job_6f7g8h',
    name: 'Generate Monthly Report',
    status: JobStatus.FAILED,
    queue: 'Report Generation',
    createdAt: '2023-10-14 23:00:00',
    processedAt: '2023-10-14 23:00:05',
    failedAt: '2023-10-14 23:05:30',
    error: 'Database connection timeout',
    data: { report_type: 'financial', period: 'October 2023', error: 'Database connection timeout' },
    attempts: 3,
    maxAttempts: 3,
    duration: 330000,
  },
  {
    id: 'job_7g8h9i',
    name: 'Send Push Notification',
    status: JobStatus.COMPLETED,
    queue: 'Push Notifications',
    createdAt: '2023-10-15 08:30:00',
    processedAt: '2023-10-15 08:30:01',
    completedAt: '2023-10-15 08:30:05',
    data: { user_ids: ['user_123', 'user_456', 'user_789'], title: 'New Feature Available', body: 'Check out our latest update!' },
    attempts: 1,
    maxAttempts: 3,
    duration: 4000,
  },
  {
    id: 'job_8h9i0j',
    name: 'Daily Database Backup',
    status: JobStatus.ACTIVE,
    queue: 'Database Backup',
    createdAt: '2023-10-15 02:00:00',
    processedAt: '2023-10-15 02:00:05',
    data: { database: 'production', size: '4.2GB', destination: 's3://backups/daily/' },
    attempts: 1,
    maxAttempts: 3,
  },
  {
    id: 'job_9i0j1k',
    name: 'Process Analytics Data',
    status: JobStatus.WAITING,
    queue: 'Analytics Processing',
    createdAt: '2023-10-15 12:00:00',
    data: { source: 'web_traffic', period: 'last_24h', metrics: ['pageviews', 'sessions', 'conversions'] },
    attempts: 0,
    maxAttempts: 3,
  },
  {
    id: 'job_0j1k2l',
    name: 'Send Weekly Newsletter',
    status: JobStatus.WAITING,
    queue: 'Email Queue',
    createdAt: '2023-10-15 13:15:00',
    data: { recipients_count: 4578, template: 'weekly_digest', scheduled: true },
    attempts: 0,
    maxAttempts: 3,
  },
  {
    id: 'job_1k2l3m',
    name: 'Optimize Product Images',
    status: JobStatus.COMPLETED,
    queue: 'Image Processing',
    createdAt: '2023-10-14 15:30:00',
    processedAt: '2023-10-14 15:30:05',
    completedAt: '2023-10-14 15:35:12',
    data: { product_ids: ['prod_123', 'prod_124', 'prod_125'], format: 'webp', compression: 'high' },
    attempts: 1,
    maxAttempts: 3,
    duration: 307000,
  },
  {
    id: 'job_2l3m4n',
    name: 'Generate Sales Report',
    status: JobStatus.COMPLETED,
    queue: 'Report Generation',
    createdAt: '2023-10-14 10:00:00',
    processedAt: '2023-10-14 10:00:03',
    completedAt: '2023-10-14 10:04:45',
    data: { report_type: 'sales', period: 'Q3 2023', format: 'pdf' },
    attempts: 1,
    maxAttempts: 3,
    duration: 282000,
  },
]

const mockJobGroups: JobGroup[] = [
  { id: 'group_email_campaigns', name: 'Email Campaigns', jobCount: 124, activeJobs: 3, waitingJobs: 21, completedJobs: 98, failedJobs: 2, createdAt: '2023-10-01 08:30:45', updatedAt: '2023-10-15 14:22:33' },
  { id: 'group_data_imports', name: 'Data Imports', jobCount: 56, activeJobs: 1, waitingJobs: 12, completedJobs: 42, failedJobs: 1, createdAt: '2023-10-05 11:15:22', updatedAt: '2023-10-15 09:45:12' },
  { id: 'group_media_processing', name: 'Media Processing', jobCount: 87, activeJobs: 5, waitingJobs: 18, completedJobs: 62, failedJobs: 2, createdAt: '2023-09-28 15:40:10', updatedAt: '2023-10-15 16:30:45' },
  { id: 'group_reporting', name: 'Regular Reports', jobCount: 42, activeJobs: 2, waitingJobs: 8, completedJobs: 32, failedJobs: 0, createdAt: '2023-10-10 09:00:00', updatedAt: '2023-10-15 10:15:30' },
  { id: 'group_notifications', name: 'User Notifications', jobCount: 156, activeJobs: 4, waitingJobs: 22, completedJobs: 128, failedJobs: 2, createdAt: '2023-09-15 14:25:50', updatedAt: '2023-10-15 17:10:24' },
]

const mockBatches: Batch[] = [
  { id: 'batch_1', name: 'October Email Campaign', totalJobs: 500, pendingJobs: 45, processedJobs: 448, failedJobs: 7, progress: 91, status: 'processing', createdAt: '2023-10-15 08:00:00' },
  { id: 'batch_2', name: 'Image Migration v2', totalJobs: 1200, pendingJobs: 0, processedJobs: 1195, failedJobs: 5, progress: 100, status: 'completed', createdAt: '2023-10-14 22:00:00', finishedAt: '2023-10-15 04:30:00' },
  { id: 'batch_3', name: 'Q3 Report Generation', totalJobs: 12, pendingJobs: 0, processedJobs: 10, failedJobs: 2, progress: 100, status: 'completed_with_failures', createdAt: '2023-10-14 10:00:00', finishedAt: '2023-10-14 10:45:00' },
  { id: 'batch_4', name: 'User Data Sync', totalJobs: 350, pendingJobs: 350, processedJobs: 0, failedJobs: 0, progress: 0, status: 'pending', createdAt: '2023-10-15 14:00:00' },
  { id: 'batch_5', name: 'Nightly Cleanup', totalJobs: 200, pendingJobs: 120, processedJobs: 78, failedJobs: 2, progress: 40, status: 'processing', createdAt: '2023-10-15 01:00:00' },
]

const mockDependencyGraph: JobDependencyGraph = {
  nodes: [
    { id: 'job_1', name: 'Data Extract', status: JobStatus.COMPLETED },
    { id: 'job_2', name: 'Data Transform', status: JobStatus.COMPLETED },
    { id: 'job_3', name: 'Data Load', status: JobStatus.ACTIVE },
    { id: 'job_4', name: 'Generate Report', status: JobStatus.WAITING },
    { id: 'job_5', name: 'Send Email', status: JobStatus.WAITING },
    { id: 'job_6', name: 'Archive Data', status: JobStatus.WAITING },
    { id: 'job_7', name: 'Failed Job', status: JobStatus.FAILED },
    { id: 'job_8', name: 'Cleanup', status: JobStatus.WAITING },
  ],
  links: [
    { source: 'job_1', target: 'job_2' },
    { source: 'job_2', target: 'job_3' },
    { source: 'job_3', target: 'job_4' },
    { source: 'job_3', target: 'job_5' },
    { source: 'job_3', target: 'job_6' },
    { source: 'job_2', target: 'job_7' },
    { source: 'job_6', target: 'job_8' },
    { source: 'job_7', target: 'job_8' },
  ],
}

function generateMockMetrics(timeRange: string): MetricsData {
  const dataPoints = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30
  const timestamps: string[] = []
  const throughput: number[] = []
  const latency: number[] = []
  const errorRate: number[] = []

  const now = new Date()
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date()
    if (timeRange === '24h') {
      date.setHours(now.getHours() - i)
      timestamps.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    else {
      date.setDate(now.getDate() - i)
      timestamps.push(date.toLocaleDateString([], { month: 'short', day: 'numeric' }))
    }

    let timeMultiplier = 1
    if (timeRange === '24h') {
      const hour = (now.getHours() - (dataPoints - 1) + i) % 24
      if (hour >= 0 && hour < 6)
        timeMultiplier = 0.3
      else if (hour >= 6 && hour < 9)
        timeMultiplier = 0.7
      else if (hour >= 9 && hour < 17)
        timeMultiplier = 1.2
      else if (hour >= 17 && hour < 20)
        timeMultiplier = 1
      else timeMultiplier = 0.6
    }

    throughput.push(Math.round((100 + (Math.random() * 100 - 50)) * timeMultiplier))
    latency.push(Math.round(200 + Math.random() * 300))
    errorRate.push(Math.round(Math.random() * 500) / 100)
  }

  return { throughput, latency, errorRate, timestamps }
}

// ---------------------------------------------------------------------------
// Fetch Functions
// ---------------------------------------------------------------------------

export async function fetchQueues(_config: DashboardConfig): Promise<Queue[]> {
  return mockQueues
}

export async function fetchQueueMetrics(_config: DashboardConfig): Promise<QueueMetrics[]> {
  return mockQueues.map(q => ({
    name: q.name,
    waiting: q.pendingJobs,
    active: q.activeJobs,
    completed: q.completedJobs,
    failed: q.failedJobs,
    delayed: 0,
    paused: q.status === 'paused',
    throughput: Math.round(Math.random() * 50 + 10),
    errorRate: q.failedJobs / Math.max(q.jobCount, 1) * 100,
    avgProcessingTime: Math.round(Math.random() * 2000 + 500),
  }))
}

export async function fetchQueueById(_config: DashboardConfig, id: string): Promise<Queue | undefined> {
  return mockQueues.find(q => q.id === id)
}

export async function fetchJobs(_config: DashboardConfig, queue?: string, status?: string): Promise<JobData[]> {
  let filtered = mockJobs
  if (queue)
    filtered = filtered.filter(j => j.queue === queue || j.queue.toLowerCase().includes(queue.toLowerCase()))
  if (status && status !== 'all')
    filtered = filtered.filter(j => j.status === status)
  return filtered
}

export async function fetchJobById(_config: DashboardConfig, id: string): Promise<JobData | undefined> {
  return mockJobs.find(j => j.id === id)
}

export async function fetchJobGroups(_config: DashboardConfig): Promise<JobGroup[]> {
  return mockJobGroups
}

export async function fetchJobGroupById(_config: DashboardConfig, id: string): Promise<JobGroup | undefined> {
  return mockJobGroups.find(g => g.id === id)
}

export async function fetchBatches(_config: DashboardConfig): Promise<Batch[]> {
  return mockBatches
}

export async function fetchBatchById(_config: DashboardConfig, id: string): Promise<Batch | undefined> {
  return mockBatches.find(b => b.id === id)
}

export async function fetchDependencyGraph(_config: DashboardConfig): Promise<JobDependencyGraph> {
  return mockDependencyGraph
}

export async function fetchMetrics(_config: DashboardConfig, timeRange: string = '24h'): Promise<MetricsData> {
  return generateMockMetrics(timeRange)
}

export async function fetchDashboardStats(_config: DashboardConfig): Promise<DashboardStats> {
  const totalJobs = mockQueues.reduce((sum, q) => sum + q.jobCount, 0)
  return {
    totalQueues: mockQueues.filter(q => q.status === 'active').length,
    totalJobs,
    activeJobs: mockQueues.reduce((sum, q) => sum + q.activeJobs, 0),
    completedJobs: mockQueues.reduce((sum, q) => sum + q.completedJobs, 0),
    failedJobs: mockQueues.reduce((sum, q) => sum + q.failedJobs, 0),
    throughputPerMinute: 64,
    avgLatency: 245,
    uptime: 86400,
  }
}

// ---------------------------------------------------------------------------
// API Route Handlers
// ---------------------------------------------------------------------------

export function createApiRoutes(config: DashboardConfig) {
  const resolvedConfig = resolveConfig(config)

  return {
    '/api/stats': async () => {
      const stats = await fetchDashboardStats(resolvedConfig)
      return Response.json(stats)
    },
    '/api/queues': async () => {
      const queues = await fetchQueues(resolvedConfig)
      return Response.json(queues)
    },
    '/api/queues/metrics': async () => {
      const metrics = await fetchQueueMetrics(resolvedConfig)
      return Response.json(metrics)
    },
    '/api/jobs': async (req: Request) => {
      const url = new URL(req.url)
      const queue = url.searchParams.get('queue') ?? undefined
      const status = url.searchParams.get('status') ?? undefined
      const jobs = await fetchJobs(resolvedConfig, queue, status)
      return Response.json(jobs)
    },
    '/api/groups': async () => {
      const groups = await fetchJobGroups(resolvedConfig)
      return Response.json(groups)
    },
    '/api/batches': async () => {
      const batches = await fetchBatches(resolvedConfig)
      return Response.json(batches)
    },
    '/api/dependencies': async () => {
      const graph = await fetchDependencyGraph(resolvedConfig)
      return Response.json(graph)
    },
    '/api/metrics': async (req: Request) => {
      const url = new URL(req.url)
      const timeRange = url.searchParams.get('timeRange') ?? '24h'
      const metrics = await fetchMetrics(resolvedConfig, timeRange)
      return Response.json(metrics)
    },
  }
}
