import type { DashboardConfig } from './types'
import { createApiRoutes, fetchBatchById, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobById, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueueById, fetchQueues } from './api'
import { resolveConfig } from './api'

export type { Batch, DashboardConfig, DashboardStats, JobData, JobDependencyGraph, JobGroup, JobNode, MetricsData, Queue, QueueMetrics } from './types'
export { JobStatus } from './types'
export { createApiRoutes, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueueMetrics, fetchQueues } from './api'

export async function serveDashboard(options: DashboardConfig = {}): Promise<void> {
  const config = resolveConfig(options)
  const apiRoutes = createApiRoutes(config)

  const server = Bun.serve({
    port: config.port,
    hostname: config.host,

    async fetch(req: Request) {
      const url = new URL(req.url)
      const path = url.pathname

      // API routes
      const apiHandler = apiRoutes[path as keyof typeof apiRoutes]
      if (apiHandler) {
        return apiHandler(req)
      }

      // Dynamic API routes (with path params)
      const queueMatch = path.match(/^\/api\/queues\/([^/]+)$/)
      if (queueMatch) {
        const queue = await fetchQueueById(config, queueMatch[1])
        if (!queue)
          return Response.json({ error: 'Queue not found' }, { status: 404 })
        return Response.json(queue)
      }

      const jobMatch = path.match(/^\/api\/jobs\/([^/]+)$/)
      if (jobMatch) {
        const job = await fetchJobById(config, jobMatch[1])
        if (!job)
          return Response.json({ error: 'Job not found' }, { status: 404 })
        return Response.json(job)
      }

      const groupMatch = path.match(/^\/api\/groups\/([^/]+)$/)
      if (groupMatch) {
        const group = await fetchJobGroups(config).then(groups => groups.find(g => g.id === groupMatch[1]))
        if (!group)
          return Response.json({ error: 'Group not found' }, { status: 404 })
        return Response.json(group)
      }

      const groupJobsMatch = path.match(/^\/api\/groups\/([^/]+)\/jobs$/)
      if (groupJobsMatch) {
        const group = await fetchJobGroups(config).then(groups => groups.find(g => g.id === groupJobsMatch[1]))
        if (!group)
          return Response.json({ error: 'Group not found' }, { status: 404 })
        const allJobs = await fetchJobs(config)
        const groupName = group.name.toLowerCase()
        const groupJobs = allJobs.filter(j => j.name.toLowerCase().includes(groupName.split(' ')[0]))
        return Response.json(groupJobs)
      }

      const batchMatch = path.match(/^\/api\/batches\/([^/]+)$/)
      if (batchMatch) {
        const batch = await fetchBatchById(config, batchMatch[1])
        if (!batch)
          return Response.json({ error: 'Batch not found' }, { status: 404 })
        return Response.json(batch)
      }

      const batchJobsMatch = path.match(/^\/api\/batches\/([^/]+)\/jobs$/)
      if (batchJobsMatch) {
        const batch = await fetchBatchById(config, batchJobsMatch[1])
        if (!batch)
          return Response.json({ error: 'Batch not found' }, { status: 404 })
        const allJobs = await fetchJobs(config)
        return Response.json(allJobs.slice(0, batch.totalJobs > 10 ? 10 : batch.totalJobs))
      }

      // Page routes — serve stx templates
      // TODO: Integrate stx template rendering engine
      const pageRoutes: Record<string, string> = {
        '/': 'Dashboard',
        '/monitoring': 'Monitoring',
        '/metrics': 'Metrics',
        '/queues': 'Queues',
        '/jobs': 'Jobs',
        '/batches': 'Batches',
        '/groups': 'Groups',
        '/dependencies': 'Dependencies',
      }

      // Static page routes
      if (pageRoutes[path]) {
        // For now, return page name as placeholder
        // Once stx rendering is integrated, this will render the .stx template
        return new Response(`<!DOCTYPE html><html><head><title>${pageRoutes[path]} - bun-queue</title></head><body><h1>${pageRoutes[path]}</h1><p>stx template rendering pending integration</p></body></html>`, {
          headers: { 'Content-Type': 'text/html' },
        })
      }

      // Dynamic page routes (detail views)
      if (path.match(/^\/queues\/[^/]+$/)) {
        return new Response('<!DOCTYPE html><html><head><title>Queue Details - bun-queue</title></head><body><h1>Queue Details</h1></body></html>', {
          headers: { 'Content-Type': 'text/html' },
        })
      }
      if (path.match(/^\/jobs\/[^/]+$/)) {
        return new Response('<!DOCTYPE html><html><head><title>Job Details - bun-queue</title></head><body><h1>Job Details</h1></body></html>', {
          headers: { 'Content-Type': 'text/html' },
        })
      }
      if (path.match(/^\/batches\/[^/]+$/)) {
        return new Response('<!DOCTYPE html><html><head><title>Batch Details - bun-queue</title></head><body><h1>Batch Details</h1></body></html>', {
          headers: { 'Content-Type': 'text/html' },
        })
      }
      if (path.match(/^\/groups\/[^/]+$/)) {
        return new Response('<!DOCTYPE html><html><head><title>Group Details - bun-queue</title></head><body><h1>Group Details</h1></body></html>', {
          headers: { 'Content-Type': 'text/html' },
        })
      }

      return new Response('Not Found', { status: 404 })
    },
  })

  console.log(`bun-queue dashboard running at http://${server.hostname}:${server.port}`)
}
