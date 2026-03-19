import type { DashboardConfig } from './types'
import path from 'node:path'
import { defaultConfig as stxDefaultConfig, injectRouterScript, processDirectives } from '@stacksjs/stx'
import { BroadcastServer } from 'ts-broadcasting'
import { createApiRoutes, fetchBatchById, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobById, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueueById, fetchQueues } from './api'
import { resolveConfig } from './api'

export type { Batch, DashboardConfig, DashboardStats, DependencyGraph, DependencyNode, JobData, JobGroup, MetricsData, Queue, QueueMetrics } from './types'
export { JobStatus } from './types'
export { createApiRoutes, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueueMetrics, fetchQueues } from './api'

const PAGES_DIR = path.join(import.meta.dir, 'pages')
const FUNCTIONS_ENTRY = path.join(import.meta.dir, 'functions', 'browser.ts')

let broadcastServer: BroadcastServer | null = null
let bundledFunctionsJs: string | null = null

async function buildFunctionsBundle(): Promise<string> {
  if (bundledFunctionsJs) return bundledFunctionsJs

  const result = await Bun.build({
    entrypoints: [FUNCTIONS_ENTRY],
    target: 'browser',
    minify: false,
    format: 'iife',
  })

  if (!result.success) {
    console.error('Failed to build functions bundle:', result.logs)
    return ''
  }

  bundledFunctionsJs = await result.outputs[0].text()
  return bundledFunctionsJs
}

async function renderStxPage(templateName: string, wsUrl: string): Promise<string> {
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

  // Inject WebSocket URL for real-time updates
  html = html.replace('</head>', `<script>window.__BQ_WS_URL = "${wsUrl}";</script>\n</head>`)

  return html
}

function wireQueueEvents(queues: any[]): void {
  if (!broadcastServer) return

  for (const queue of queues) {
    const queueName = queue.name

    queue.events.on('jobAdded', (jobId: string) => {
      broadcastServer!.broadcast(`queue.${queueName}`, 'job.added', { jobId, queue: queueName, timestamp: Date.now() })
      broadcastServer!.broadcast('dashboard', 'job.added', { jobId, queue: queueName, timestamp: Date.now() })
    })

    queue.events.on('jobCompleted', (jobId: string, result: any) => {
      broadcastServer!.broadcast(`queue.${queueName}`, 'job.completed', { jobId, queue: queueName, result, timestamp: Date.now() })
      broadcastServer!.broadcast('dashboard', 'job.completed', { jobId, queue: queueName, timestamp: Date.now() })
    })

    queue.events.on('jobFailed', (jobId: string, error: Error) => {
      broadcastServer!.broadcast(`queue.${queueName}`, 'job.failed', { jobId, queue: queueName, error: error.message, timestamp: Date.now() })
      broadcastServer!.broadcast('dashboard', 'job.failed', { jobId, queue: queueName, error: error.message, timestamp: Date.now() })
    })

    queue.events.on('jobActive', (jobId: string) => {
      broadcastServer!.broadcast(`queue.${queueName}`, 'job.active', { jobId, queue: queueName, timestamp: Date.now() })
      broadcastServer!.broadcast('dashboard', 'job.active', { jobId, queue: queueName, timestamp: Date.now() })
    })

    queue.events.on('jobProgress', (jobId: string, progress: number) => {
      broadcastServer!.broadcast(`queue.${queueName}`, 'job.progress', { jobId, queue: queueName, progress, timestamp: Date.now() })
    })

    queue.events.on('jobStalled', (jobId: string) => {
      broadcastServer!.broadcast(`queue.${queueName}`, 'job.stalled', { jobId, queue: queueName, timestamp: Date.now() })
      broadcastServer!.broadcast('dashboard', 'job.stalled', { jobId, queue: queueName, timestamp: Date.now() })
    })

    queue.events.on('jobRemoved', (jobId: string) => {
      broadcastServer!.broadcast(`queue.${queueName}`, 'job.removed', { jobId, queue: queueName, timestamp: Date.now() })
      broadcastServer!.broadcast('dashboard', 'job.removed', { jobId, queue: queueName, timestamp: Date.now() })
    })

    queue.events.on('batchAdded', (batchId: string, jobIds: string[]) => {
      broadcastServer!.broadcast('dashboard', 'batch.added', { batchId, jobCount: jobIds.length, queue: queueName, timestamp: Date.now() })
    })

    queue.events.on('batchCompleted', (batchId: string) => {
      broadcastServer!.broadcast('dashboard', 'batch.completed', { batchId, queue: queueName, timestamp: Date.now() })
    })
  }
}

export async function serveDashboard(options: DashboardConfig = {}): Promise<void> {
  const config = resolveConfig(options)
  const apiRoutes = createApiRoutes(config)

  // Start WebSocket broadcast server for real-time updates
  const broadcastPort = options.broadcastPort || 6001
  broadcastServer = new BroadcastServer({
    connections: {
      default: {
        driver: 'bun',
        host: '0.0.0.0',
        port: broadcastPort,
      },
    },
    default: 'default',
    debug: false,
  })
  await broadcastServer.start()

  // Wire queue events to broadcast channels
  const allQueues = config.queues || []
  if (allQueues.length) {
    wireQueueEvents(allQueues)
  }

  const wsUrl = `ws://localhost:${broadcastPort}/app`

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

      // Shared functions bundle
      if (path === '/bq-utils.js') {
        const js = await buildFunctionsBundle()
        return new Response(js, { headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store' } })
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
        const html = await renderStxPage(pageMap[path], wsUrl)
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
          const html = await renderStxPage(template, wsUrl)
          return new Response(html, { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } })
        }
      }

      return new Response('Not Found', { status: 404 })
    },
  })

  console.log(`bun-queue dashboard running at http://${server.hostname}:${server.port}`)
  console.log(`WebSocket broadcast server running at ws://localhost:${broadcastPort}/app`)
}
