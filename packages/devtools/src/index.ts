import type { DashboardConfig } from './types'
import path from 'node:path'
import { serveApp } from '@stacksjs/stx'
import { BroadcastServer } from 'ts-broadcasting'
import { resolveConfig } from './api'

export type { Batch, DashboardConfig, DashboardStats, DependencyGraph, DependencyNode, JobData, JobGroup, MetricsData, Queue, QueueMetrics } from './types'
export { JobStatus } from './types'
export { createApiRoutes, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueueMetrics, fetchQueues } from './api'

let broadcastServer: BroadcastServer | null = null

function wireQueueEvents(queues: any[]): void {
  if (!broadcastServer) return
  for (const queue of queues) {
    const queueName = queue.name
    queue.events.on('jobAdded', (jobId: string) => { broadcastServer!.broadcast(`queue.${queueName}`, 'job.added', { jobId, queue: queueName, timestamp: Date.now() }); broadcastServer!.broadcast('dashboard', 'job.added', { jobId, queue: queueName, timestamp: Date.now() }) })
    queue.events.on('jobCompleted', (jobId: string, result: any) => { broadcastServer!.broadcast(`queue.${queueName}`, 'job.completed', { jobId, queue: queueName, result, timestamp: Date.now() }); broadcastServer!.broadcast('dashboard', 'job.completed', { jobId, queue: queueName, timestamp: Date.now() }) })
    queue.events.on('jobFailed', (jobId: string, error: Error) => { broadcastServer!.broadcast(`queue.${queueName}`, 'job.failed', { jobId, queue: queueName, error: error.message, timestamp: Date.now() }); broadcastServer!.broadcast('dashboard', 'job.failed', { jobId, queue: queueName, error: error.message, timestamp: Date.now() }) })
    queue.events.on('jobActive', (jobId: string) => { broadcastServer!.broadcast(`queue.${queueName}`, 'job.active', { jobId, queue: queueName, timestamp: Date.now() }); broadcastServer!.broadcast('dashboard', 'job.active', { jobId, queue: queueName, timestamp: Date.now() }) })
    queue.events.on('jobProgress', (jobId: string, progress: number) => { broadcastServer!.broadcast(`queue.${queueName}`, 'job.progress', { jobId, queue: queueName, progress, timestamp: Date.now() }) })
    queue.events.on('jobStalled', (jobId: string) => { broadcastServer!.broadcast(`queue.${queueName}`, 'job.stalled', { jobId, queue: queueName, timestamp: Date.now() }); broadcastServer!.broadcast('dashboard', 'job.stalled', { jobId, queue: queueName, timestamp: Date.now() }) })
    queue.events.on('jobRemoved', (jobId: string) => { broadcastServer!.broadcast(`queue.${queueName}`, 'job.removed', { jobId, queue: queueName, timestamp: Date.now() }); broadcastServer!.broadcast('dashboard', 'job.removed', { jobId, queue: queueName, timestamp: Date.now() }) })
    queue.events.on('batchAdded', (batchId: string, jobIds: string[]) => { broadcastServer!.broadcast('dashboard', 'batch.added', { batchId, jobCount: jobIds.length, queue: queueName, timestamp: Date.now() }) })
    queue.events.on('batchCompleted', (batchId: string) => { broadcastServer!.broadcast('dashboard', 'batch.completed', { batchId, queue: queueName, timestamp: Date.now() }) })
  }
}

export async function serveDashboard(options: DashboardConfig = {}): Promise<void> {
  const config = resolveConfig(options)

  // Start WebSocket broadcast server
  const broadcastPort = options.broadcastPort || 6001
  broadcastServer = new BroadcastServer({ connections: { default: { driver: 'bun', host: '0.0.0.0', port: broadcastPort } }, default: 'default', debug: false })
  await broadcastServer.start()

  const allQueues = config.queues || []
  if (allQueues.length) wireQueueEvents(allQueues)

  // Let stx handle everything — pages, layout, SPA fragments, routing
  const appDir = path.join(import.meta.dir)
  await serveApp(appDir, {
    port: config.port,
    watch: true,
    hotReload: false,
  })
}
