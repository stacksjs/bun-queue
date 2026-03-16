import type { DashboardConfig } from './types'
import path from 'node:path'
import { defaultConfig as stxDefaultConfig, injectRouterScript, processDirectives } from '@stacksjs/stx'
import { createApiRoutes, fetchBatchById, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobById, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueueById, fetchQueues } from './api'
import { resolveConfig } from './api'

export type { Batch, DashboardConfig, DashboardStats, DependencyGraph, DependencyNode, JobData, JobGroup, MetricsData, Queue, QueueMetrics } from './types'
export { JobStatus } from './types'
export { createApiRoutes, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueueMetrics, fetchQueues } from './api'

const PAGES_DIR = path.join(import.meta.dir, 'pages')

async function renderStxPage(templateName: string): Promise<string> {
  const templatePath = path.join(PAGES_DIR, `${templateName}.stx`)
  const content = await Bun.file(templatePath).text()

  const config = {
    ...stxDefaultConfig,
    componentsDir: path.join(import.meta.dir, 'components'),
    layoutsDir: path.join(import.meta.dir, 'layouts'),
    partialsDir: path.join(import.meta.dir, 'partials'),
  }

  const context = { __filename: templatePath, __dirname: path.dirname(templatePath) }
  let html = await processDirectives(content, context, templatePath, config, new Set())
  html = injectRouterScript(html)
  return html
}

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

      // Job retry: POST /api/jobs/:id/retry
      const retryMatch = path.match(/^\/api\/jobs\/([^/]+)\/retry$/)
      if (retryMatch && req.method === 'POST') {
        const jobId = decodeURIComponent(retryMatch[1])
        const queues = config.queues || []
        const manager = config.queueManager
        let retried = false

        // Try to find and retry the job across all queues
        const allQueues = queues.length ? queues : manager ? (() => {
          const qs: any[] = []
          for (const connName of manager.getConnections()) {
            try {
              const conn = manager.connection(connName)
              for (const q of conn.queues.values()) qs.push(q)
            }
catch {}
          }
          return qs
        })() : []

        for (const q of allQueues) {
          try {
            const result = await q.retryJob(jobId)
            if (result) { retried = true; break }
          }
catch { /* try next queue */ }
        }

        return Response.json({ success: retried })
      }

      // Job delete: DELETE /api/jobs/:id
      const deleteMatch = path.match(/^\/api\/jobs\/([^/]+)$/)
      if (deleteMatch && req.method === 'DELETE') {
        const jobId = decodeURIComponent(deleteMatch[1])
        const queues = config.queues || []
        const manager = config.queueManager
        let deleted = false

        const allQueues = queues.length ? queues : manager ? (() => {
          const qs: any[] = []
          for (const connName of manager.getConnections()) {
            try {
              const conn = manager.connection(connName)
              for (const q of conn.queues.values()) qs.push(q)
            }
catch {}
          }
          return qs
        })() : []

        for (const q of allQueues) {
          try {
            await q.removeJob(jobId)
            deleted = true
            break
          }
catch { /* try next queue */ }
        }

        return Response.json({ success: deleted })
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

      // Static page routes
      const pageMap: Record<string, string> = {
        '/': 'index',
        '/monitoring': 'monitoring',
        '/metrics': 'metrics',
        '/queues': 'queues',
        '/jobs': 'jobs',
        '/batches': 'batches',
        '/groups': 'groups',
        '/dependencies': 'dependencies',
      }

      if (pageMap[path]) {
        const html = await renderStxPage(pageMap[path])
        return new Response(html, { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } })
      }

      // Dynamic page routes (detail views)
      const dynamicPages: Array<{ pattern: RegExp, template: string }> = [
        { pattern: /^\/queues\/[^/]+$/, template: 'queue-details' },
        { pattern: /^\/jobs\/[^/]+$/, template: 'job-details' },
        { pattern: /^\/batches\/[^/]+$/, template: 'batch-details' },
        { pattern: /^\/groups\/[^/]+$/, template: 'group-details' },
      ]

      for (const { pattern, template } of dynamicPages) {
        if (pattern.test(path)) {
          const html = await renderStxPage(template)
          return new Response(html, { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } })
        }
      }

      return new Response('Not Found', { status: 404 })
    },
  })

  console.log(`bun-queue dashboard running at http://${server.hostname}:${server.port}`)
}
