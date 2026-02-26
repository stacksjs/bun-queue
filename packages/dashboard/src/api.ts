import type { DashboardConfig, DashboardStats, JobData, QueueMetrics } from './types'

const defaultConfig: Required<Pick<DashboardConfig, 'port' | 'host' | 'refreshInterval'>> = {
  port: 4400,
  host: 'localhost',
  refreshInterval: 5000,
}

export function resolveConfig(config: DashboardConfig): DashboardConfig & typeof defaultConfig {
  return { ...defaultConfig, ...config }
}

export async function fetchQueueMetrics(_config: DashboardConfig): Promise<QueueMetrics[]> {
  // TODO: Connect to Redis and read bun-queue metrics
  // This will use the bun-queue internal Redis keys to aggregate data
  return [
    {
      name: 'default',
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: false,
      throughput: 0,
      errorRate: 0,
      avgProcessingTime: 0,
    },
  ]
}

export async function fetchJobs(_config: DashboardConfig, _queue?: string, _status?: string): Promise<JobData[]> {
  // TODO: Read job data from Redis
  return []
}

export async function fetchDashboardStats(_config: DashboardConfig): Promise<DashboardStats> {
  // TODO: Aggregate stats from Redis
  return {
    totalQueues: 0,
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    throughputPerMinute: 0,
    avgLatency: 0,
    uptime: 0,
  }
}

export function createApiRoutes(config: DashboardConfig) {
  const resolvedConfig = resolveConfig(config)

  return {
    '/api/stats': async () => {
      const stats = await fetchDashboardStats(resolvedConfig)
      return Response.json(stats)
    },
    '/api/queues': async () => {
      const queues = await fetchQueueMetrics(resolvedConfig)
      return Response.json(queues)
    },
    '/api/jobs': async (req: Request) => {
      const url = new URL(req.url)
      const queue = url.searchParams.get('queue') ?? undefined
      const status = url.searchParams.get('status') ?? undefined
      const jobs = await fetchJobs(resolvedConfig, queue, status)
      return Response.json(jobs)
    },
  }
}
