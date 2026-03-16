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
// Queue Resolution — get all Queue instances from config
// ---------------------------------------------------------------------------

function getQueuesFromConfig(config: DashboardConfig): any[] {
  // Direct queue instances passed
  if (config.queues?.length) {
    return config.queues
  }

  // QueueManager passed — collect all registered queues across connections
  if (config.queueManager) {
    const manager = config.queueManager
    const queues: any[] = []
    for (const connName of manager.getConnections()) {
      try {
        const conn = manager.connection(connName)
        for (const queue of conn.queues.values()) {
          queues.push(queue)
        }
      }
      catch { /* connection not initialized yet */ }
    }
    return queues
  }

  return []
}

function hasRealQueues(config: DashboardConfig): boolean {
  return !!(config.queues?.length || config.queueManager)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts?: number): string {
  if (!ts) return ''
  return new Date(ts).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
}

function deriveQueueStatus(counts: Record<string, number>, isPaused: boolean): string {
  if (isPaused) return 'paused'
  if (counts.active > 0) return 'active'
  if (counts.waiting > 0) return 'active'
  return 'idle'
}

// ---------------------------------------------------------------------------
// Real Data Fetch Functions
// ---------------------------------------------------------------------------

async function fetchQueuesReal(config: DashboardConfig): Promise<Queue[]> {
  const queues = getQueuesFromConfig(config)
  return Promise.all(queues.map(async (q: any) => {
    const counts = await q.getJobCounts()
    const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0)
    const isPaused = counts.paused > 0

    return {
      id: q.name,
      name: q.name,
      status: deriveQueueStatus(counts, isPaused),
      jobCount: total,
      pendingJobs: counts.waiting || 0,
      activeJobs: counts.active || 0,
      completedJobs: counts.completed || 0,
      failedJobs: counts.failed || 0,
    }
  }))
}

async function fetchQueueMetricsReal(config: DashboardConfig): Promise<QueueMetrics[]> {
  const queues = getQueuesFromConfig(config)
  return Promise.all(queues.map(async (q: any) => {
    const counts = await q.getJobCounts()
    const metrics = await q.getMetrics()
    const total = (counts.completed || 0) + (counts.failed || 0)
    const errorRate = total > 0 ? ((counts.failed || 0) / total) * 100 : 0

    return {
      name: q.name,
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: (counts.paused || 0) > 0,
      throughput: metrics?.processedRate || 0,
      errorRate: Math.round(errorRate * 100) / 100,
      avgProcessingTime: 0, // computed below if metrics available
    }
  }))
}

async function fetchQueueByIdReal(config: DashboardConfig, id: string): Promise<Queue | undefined> {
  const queues = getQueuesFromConfig(config)
  const q = queues.find((q: any) => q.name === id)
  if (!q) return undefined

  const counts = await q.getJobCounts()
  const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0)

  return {
    id: q.name,
    name: q.name,
    status: deriveQueueStatus(counts, (counts.paused || 0) > 0),
    jobCount: total,
    pendingJobs: counts.waiting || 0,
    activeJobs: counts.active || 0,
    completedJobs: counts.completed || 0,
    failedJobs: counts.failed || 0,
  }
}

function mapJobToJobData(job: any, queueName: string): JobData {
  let status: string = JobStatus.WAITING
  if (job.finishedOn && job.failedReason) status = JobStatus.FAILED
  else if (job.finishedOn) status = JobStatus.COMPLETED
  else if (job.processedOn) status = JobStatus.ACTIVE
  else if (job.delay && job.delay > 0) status = JobStatus.DELAYED

  const duration = (job.finishedOn && job.processedOn)
    ? job.finishedOn - job.processedOn
    : undefined

  return {
    id: job.id,
    name: job.name || queueName,
    queue: queueName,
    status,
    data: typeof job.data === 'object' ? job.data : { value: job.data },
    result: job.returnvalue,
    error: job.failedReason,
    attempts: job.attemptsMade || 0,
    maxAttempts: job.opts?.attempts || 1,
    createdAt: formatTimestamp(job.timestamp),
    processedAt: formatTimestamp(job.processedOn),
    completedAt: status === 'completed' ? formatTimestamp(job.finishedOn) : undefined,
    failedAt: status === 'failed' ? formatTimestamp(job.finishedOn) : undefined,
    duration,
  }
}

async function fetchJobsReal(config: DashboardConfig, queueFilter?: string, statusFilter?: string): Promise<JobData[]> {
  const queues = getQueuesFromConfig(config)
  const filtered = queueFilter
    ? queues.filter((q: any) => q.name === queueFilter || q.name.toLowerCase().includes(queueFilter.toLowerCase()))
    : queues

  const statuses: string[] = (statusFilter && statusFilter !== 'all')
    ? [statusFilter]
    : ['waiting', 'active', 'completed', 'failed', 'delayed']

  const allJobs: JobData[] = []
  for (const q of filtered) {
    for (const status of statuses) {
      try {
        const jobs = await q.getJobs(status as any, 0, 99)
        allJobs.push(...jobs.map((j: any) => mapJobToJobData(j, q.name)))
      }
      catch { /* status may not exist */ }
    }
  }

  return allJobs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

async function fetchJobByIdReal(config: DashboardConfig, id: string): Promise<JobData | undefined> {
  const queues = getQueuesFromConfig(config)
  for (const q of queues) {
    try {
      const job = await q.getJob(id)
      if (job) return mapJobToJobData(job, q.name)
    }
    catch { /* try next queue */ }
  }
  return undefined
}

async function fetchDashboardStatsReal(config: DashboardConfig): Promise<DashboardStats> {
  const queues = getQueuesFromConfig(config)
  let totalJobs = 0
  let activeJobs = 0
  let completedJobs = 0
  let failedJobs = 0
  let totalQueues = 0
  let totalThroughput = 0

  for (const q of queues) {
    const counts = await q.getJobCounts()
    const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0)
    totalJobs += total
    activeJobs += counts.active || 0
    completedJobs += counts.completed || 0
    failedJobs += counts.failed || 0
    if (counts.active > 0 || counts.waiting > 0) totalQueues++

    const metrics = await q.getMetrics()
    if (metrics?.processedRate) totalThroughput += metrics.processedRate
  }

  return {
    totalQueues,
    totalJobs,
    activeJobs,
    completedJobs,
    failedJobs,
    throughputPerMinute: Math.round(totalThroughput),
    avgLatency: 0,
    uptime: 0,
  }
}

async function fetchMetricsReal(config: DashboardConfig, timeRange: string): Promise<MetricsData> {
  const queues = getQueuesFromConfig(config)
  const dataPoints = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30

  // Aggregate metrics across all queues
  let aggregatedCompleted: number[] = []
  let aggregatedFailed: number[] = []

  for (const q of queues) {
    const metrics = await q.getMetrics()
    if (!metrics) continue

    const completed = metrics.completed || []
    const failed = metrics.failed || []

    if (aggregatedCompleted.length === 0) {
      aggregatedCompleted = [...completed]
      aggregatedFailed = [...failed]
    }
    else {
      for (let i = 0; i < completed.length && i < aggregatedCompleted.length; i++) {
        aggregatedCompleted[i] += completed[i]
        aggregatedFailed[i] += failed[i] || 0
      }
    }
  }

  // Build timestamps
  const timestamps: string[] = []
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
  }

  // Slice or pad to match dataPoints
  const throughput = aggregatedCompleted.slice(-dataPoints)
  const errorRate = aggregatedFailed.slice(-dataPoints).map((f, i) => {
    const total = (throughput[i] || 0) + f
    return total > 0 ? Math.round((f / total) * 10000) / 100 : 0
  })

  // Pad if not enough data
  while (throughput.length < dataPoints) throughput.unshift(0)
  while (errorRate.length < dataPoints) errorRate.unshift(0)

  return {
    throughput,
    latency: new Array(dataPoints).fill(0), // latency not tracked per-interval yet
    errorRate,
    timestamps,
  }
}

// ---------------------------------------------------------------------------
// Mock Data Fallback
// ---------------------------------------------------------------------------

const mockQueues: Queue[] = [
  { id: 'queue_email', name: 'Email Queue', status: 'active', jobCount: 254, pendingJobs: 48, activeJobs: 6, completedJobs: 197, failedJobs: 3 },
  { id: 'queue_image', name: 'Image Processing', status: 'active', jobCount: 178, pendingJobs: 32, activeJobs: 8, completedJobs: 135, failedJobs: 3 },
  { id: 'queue_data', name: 'Data Import', status: 'paused', jobCount: 87, pendingJobs: 42, activeJobs: 0, completedJobs: 43, failedJobs: 2 },
  { id: 'queue_report', name: 'Report Generation', status: 'active', jobCount: 112, pendingJobs: 15, activeJobs: 2, completedJobs: 92, failedJobs: 3 },
  { id: 'queue_notification', name: 'Push Notifications', status: 'active', jobCount: 329, pendingJobs: 24, activeJobs: 5, completedJobs: 300, failedJobs: 0 },
  { id: 'queue_backup', name: 'Database Backup', status: 'active', jobCount: 42, pendingJobs: 0, activeJobs: 1, completedJobs: 41, failedJobs: 0 },
  { id: 'queue_analytics', name: 'Analytics Processing', status: 'stopped', jobCount: 56, pendingJobs: 56, activeJobs: 0, completedJobs: 0, failedJobs: 0 },
]

const mockJobs: JobData[] = [
  { id: 'job_1a2b3c', name: 'Send Welcome Email', status: JobStatus.COMPLETED, queue: 'Email Queue', createdAt: '2023-10-15 09:15:22', processedAt: '2023-10-15 09:15:30', completedAt: '2023-10-15 09:15:45', data: { recipient: 'john.doe@example.com', template: 'welcome_template' }, attempts: 1, maxAttempts: 3, duration: 23000 },
  { id: 'job_2b3c4d', name: 'Send Password Reset', status: JobStatus.ACTIVE, queue: 'Email Queue', createdAt: '2023-10-15 11:42:10', processedAt: '2023-10-15 11:42:15', data: { recipient: 'sarah.smith@example.com', template: 'password_reset' }, attempts: 1, maxAttempts: 3 },
  { id: 'job_3c4d5e', name: 'Process Profile Picture', status: JobStatus.ACTIVE, queue: 'Image Processing', createdAt: '2023-10-15 10:30:00', processedAt: '2023-10-15 10:30:12', data: { user_id: 'user_789', file_size: '2.4MB' }, attempts: 1, maxAttempts: 3 },
  { id: 'job_4d5e6f', name: 'Process Product Images', status: JobStatus.WAITING, queue: 'Image Processing', createdAt: '2023-10-15 11:05:30', data: { product_id: 'prod_456', image_count: 5 }, attempts: 0, maxAttempts: 3 },
  { id: 'job_5e6f7g', name: 'Import Customer Data', status: JobStatus.WAITING, queue: 'Data Import', createdAt: '2023-10-15 11:45:00', data: { source: 'CSV Upload', records: 1250 }, attempts: 0, maxAttempts: 3 },
  { id: 'job_6f7g8h', name: 'Generate Monthly Report', status: JobStatus.FAILED, queue: 'Report Generation', createdAt: '2023-10-14 23:00:00', processedAt: '2023-10-14 23:00:05', failedAt: '2023-10-14 23:05:30', error: 'Database connection timeout', data: { report_type: 'financial' }, attempts: 3, maxAttempts: 3, duration: 330000 },
  { id: 'job_7g8h9i', name: 'Send Push Notification', status: JobStatus.COMPLETED, queue: 'Push Notifications', createdAt: '2023-10-15 08:30:00', processedAt: '2023-10-15 08:30:01', completedAt: '2023-10-15 08:30:05', data: { user_ids: ['user_123', 'user_456'] }, attempts: 1, maxAttempts: 3, duration: 4000 },
  { id: 'job_8h9i0j', name: 'Daily Database Backup', status: JobStatus.ACTIVE, queue: 'Database Backup', createdAt: '2023-10-15 02:00:00', processedAt: '2023-10-15 02:00:05', data: { database: 'production', size: '4.2GB' }, attempts: 1, maxAttempts: 3 },
]

const mockJobGroups: JobGroup[] = [
  { id: 'group_email_campaigns', name: 'Email Campaigns', jobCount: 124, activeJobs: 3, waitingJobs: 21, completedJobs: 98, failedJobs: 2, createdAt: '2023-10-01 08:30:45', updatedAt: '2023-10-15 14:22:33' },
  { id: 'group_data_imports', name: 'Data Imports', jobCount: 56, activeJobs: 1, waitingJobs: 12, completedJobs: 42, failedJobs: 1, createdAt: '2023-10-05 11:15:22', updatedAt: '2023-10-15 09:45:12' },
  { id: 'group_media_processing', name: 'Media Processing', jobCount: 87, activeJobs: 5, waitingJobs: 18, completedJobs: 62, failedJobs: 2, createdAt: '2023-09-28 15:40:10', updatedAt: '2023-10-15 16:30:45' },
]

const mockBatches: Batch[] = [
  { id: 'batch_1', name: 'October Email Campaign', totalJobs: 500, pendingJobs: 45, processedJobs: 448, failedJobs: 7, progress: 91, status: 'processing', createdAt: '2023-10-15 08:00:00' },
  { id: 'batch_2', name: 'Image Migration v2', totalJobs: 1200, pendingJobs: 0, processedJobs: 1195, failedJobs: 5, progress: 100, status: 'completed', createdAt: '2023-10-14 22:00:00', finishedAt: '2023-10-15 04:30:00' },
  { id: 'batch_3', name: 'Q3 Report Generation', totalJobs: 12, pendingJobs: 0, processedJobs: 10, failedJobs: 2, progress: 100, status: 'completed_with_failures', createdAt: '2023-10-14 10:00:00', finishedAt: '2023-10-14 10:45:00' },
]

const mockDependencyGraph: JobDependencyGraph = {
  nodes: [
    { id: 'job_1', name: 'Data Extract', status: JobStatus.COMPLETED },
    { id: 'job_2', name: 'Data Transform', status: JobStatus.COMPLETED },
    { id: 'job_3', name: 'Data Load', status: JobStatus.ACTIVE },
    { id: 'job_4', name: 'Generate Report', status: JobStatus.WAITING },
    { id: 'job_5', name: 'Send Email', status: JobStatus.WAITING },
    { id: 'job_6', name: 'Archive Data', status: JobStatus.WAITING },
  ],
  links: [
    { source: 'job_1', target: 'job_2' },
    { source: 'job_2', target: 'job_3' },
    { source: 'job_3', target: 'job_4' },
    { source: 'job_3', target: 'job_5' },
    { source: 'job_3', target: 'job_6' },
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
    throughput.push(Math.round((100 + (Math.random() * 100 - 50))))
    latency.push(Math.round(200 + Math.random() * 300))
    errorRate.push(Math.round(Math.random() * 500) / 100)
  }

  return { throughput, latency, errorRate, timestamps }
}

// ---------------------------------------------------------------------------
// Public Fetch Functions (real data with mock fallback)
// ---------------------------------------------------------------------------

export async function fetchQueues(config: DashboardConfig): Promise<Queue[]> {
  if (hasRealQueues(config)) return fetchQueuesReal(config)
  return mockQueues
}

export async function fetchQueueMetrics(config: DashboardConfig): Promise<QueueMetrics[]> {
  if (hasRealQueues(config)) return fetchQueueMetricsReal(config)
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

export async function fetchQueueById(config: DashboardConfig, id: string): Promise<Queue | undefined> {
  if (hasRealQueues(config)) return fetchQueueByIdReal(config, id)
  return mockQueues.find(q => q.id === id)
}

export async function fetchJobs(config: DashboardConfig, queue?: string, status?: string): Promise<JobData[]> {
  if (hasRealQueues(config)) return fetchJobsReal(config, queue, status)
  let filtered = mockJobs
  if (queue) filtered = filtered.filter(j => j.queue === queue || j.queue.toLowerCase().includes(queue.toLowerCase()))
  if (status && status !== 'all') filtered = filtered.filter(j => j.status === status)
  return filtered
}

export async function fetchJobById(config: DashboardConfig, id: string): Promise<JobData | undefined> {
  if (hasRealQueues(config)) return fetchJobByIdReal(config, id)
  return mockJobs.find(j => j.id === id)
}

// eslint-disable-next-line pickier/no-unused-vars
export async function fetchJobGroups(config: DashboardConfig): Promise<JobGroup[]> {
  // TODO: wire to real QueueGroup data when available
  return mockJobGroups
}

export async function fetchJobGroupById(config: DashboardConfig, id: string): Promise<JobGroup | undefined> {
  const groups = await fetchJobGroups(config)
  return groups.find(g => g.id === id)
}

// eslint-disable-next-line pickier/no-unused-vars
export async function fetchBatches(config: DashboardConfig): Promise<Batch[]> {
  // TODO: wire to real BatchProcessor data when available
  return mockBatches
}

export async function fetchBatchById(config: DashboardConfig, id: string): Promise<Batch | undefined> {
  const batches = await fetchBatches(config)
  return batches.find(b => b.id === id)
}

export async function fetchDependencyGraph(config: DashboardConfig): Promise<JobDependencyGraph> {
  if (hasRealQueues(config)) {
    // Build dependency graph from real jobs
    const allJobs = await fetchJobsReal(config)
    const nodes = allJobs
      .filter((j: JobData) => j.data && typeof j.data === 'object')
      .slice(0, 50) // limit for performance
      .map((j: JobData) => ({ id: j.id, name: j.name, status: j.status }))

    // TODO: extract real dependency links from job.dependencies
    return { nodes, links: [] }
  }
  return mockDependencyGraph
}

export async function fetchMetrics(config: DashboardConfig, timeRange: string = '24h'): Promise<MetricsData> {
  if (hasRealQueues(config)) return fetchMetricsReal(config, timeRange)
  return generateMockMetrics(timeRange)
}

export async function fetchDashboardStats(config: DashboardConfig): Promise<DashboardStats> {
  if (hasRealQueues(config)) return fetchDashboardStatsReal(config)
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
