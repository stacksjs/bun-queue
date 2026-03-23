import type { DashboardConfig } from './types'
import path from 'node:path'
import { defaultConfig as stxDefaultConfig, isSpaNavigation, processDirectives, stripDocumentWrapper } from '@stacksjs/stx'
import { BroadcastServer } from 'ts-broadcasting'
import { createApiRoutes, fetchBatchById, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobById, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueueById, fetchQueues } from './api'
import { resolveConfig } from './api'

export type { Batch, DashboardConfig, DashboardStats, DependencyGraph, DependencyNode, JobData, JobGroup, MetricsData, Queue, QueueMetrics } from './types'
export { JobStatus } from './types'
export { createApiRoutes, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueueMetrics, fetchQueues } from './api'

const SRC_DIR = import.meta.dir
const PAGES_DIR = path.join(SRC_DIR, 'pages')
const FUNCTIONS_ENTRY = path.join(SRC_DIR, 'functions', 'browser.ts')

let broadcastServer: BroadcastServer | null = null
let bundledFunctionsJs: string | null = null

const stxConfig = {
  ...stxDefaultConfig,
  componentsDir: path.join(SRC_DIR, 'components'),
  layoutsDir: path.join(SRC_DIR, 'layouts'),
  partialsDir: path.join(SRC_DIR, 'partials'),
}

async function buildFunctionsBundle(): Promise<string> {
  if (bundledFunctionsJs) return bundledFunctionsJs

  const result = await Bun.build({
    entrypoints: [FUNCTIONS_ENTRY],
    target: 'browser',
    minify: false,
    format: 'iife',
  })

  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('Failed to build functions bundle:', result.logs)
    return ''
  }

  bundledFunctionsJs = await result.outputs[0].text()
  return bundledFunctionsJs
}

async function renderStxPage(templateName: string, wsUrl: string, req: Request): Promise<Response> {
  const templatePath = path.join(PAGES_DIR, `${templateName}.stx`)
  const content = await Bun.file(templatePath).text()

  const context: Record<string, any> = { __filename: templatePath, __dirname: path.dirname(templatePath) }
  let html = await processDirectives(content, context, templatePath, stxConfig, new Set())

  // Inject WebSocket URL for real-time updates
  html = html.replace('</head>', `<script>window.__BQ_WS_URL = "${wsUrl}";</script>\n</head>`)

  // SPA navigation — extract <main> content as fragment
  if (isSpaNavigation(req)) {
    let fragment = ''

    // Extract <head> styles (page-specific styles from @push('styles'))
    const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)
    if (headMatch) {
      const headContent = headMatch[1]
      const styleRegex = /<style\b[^>]*>[\s\S]*?<\/style>/gi
      let m: RegExpExecArray | null
      while ((m = styleRegex.exec(headContent)) !== null) {
        fragment += m[0] + '\n'
      }
    }

    // Extract <main> inner content
    const mainOpenMatch = html.match(/<main\b[^>]*>/i)
    const mainCloseIdx = html.lastIndexOf('</main>')
    if (mainOpenMatch && mainCloseIdx !== -1) {
      const mainStart = mainOpenMatch.index! + mainOpenMatch[0].length
      fragment += html.slice(mainStart, mainCloseIdx)
    }

    // Strip the signals runtime IIFE (shell already has it)
    fragment = fragment.replace(
      /<script data-stx-scoped>\s*;?\(function\(\)\s*\{[\s\S]*?<\/script>/g,
      '',
    )

    return new Response(fragment, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
        'X-STX-Fragment': 'true',
      },
    })
  }

  return new Response(html, { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } })
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
      const pathname = url.pathname

      // API routes
      const apiHandler = apiRoutes[pathname as keyof typeof apiRoutes]
      if (apiHandler) {
        return apiHandler(req)
      }

      // Dynamic API routes (with path params)
      const queueMatch = pathname.match(/^\/api\/queues\/([^/]+)$/)
      if (queueMatch) {
        const queue = await fetchQueueById(config, queueMatch[1])
        if (!queue)
          return Response.json({ error: 'Queue not found' }, { status: 404 })
        return Response.json(queue)
      }

      // Job retry: POST /api/jobs/:id/retry
      const retryMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/retry$/)
      if (retryMatch && req.method === 'POST') {
        const jobId = decodeURIComponent(retryMatch[1])
        const queues = config.queues || []
        const manager = config.queueManager
        let retried = false

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
      const deleteMatch = pathname.match(/^\/api\/jobs\/([^/]+)$/)
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

      const jobMatch = pathname.match(/^\/api\/jobs\/([^/]+)$/)
      if (jobMatch) {
        const job = await fetchJobById(config, jobMatch[1])
        if (!job)
          return Response.json({ error: 'Job not found' }, { status: 404 })
        return Response.json(job)
      }

      const groupMatch = pathname.match(/^\/api\/groups\/([^/]+)$/)
      if (groupMatch) {
        const group = await fetchJobGroups(config).then(groups => groups.find(g => g.id === groupMatch[1]))
        if (!group)
          return Response.json({ error: 'Group not found' }, { status: 404 })
        return Response.json(group)
      }

      const groupJobsMatch = pathname.match(/^\/api\/groups\/([^/]+)\/jobs$/)
      if (groupJobsMatch) {
        const group = await fetchJobGroups(config).then(groups => groups.find(g => g.id === groupJobsMatch[1]))
        if (!group)
          return Response.json({ error: 'Group not found' }, { status: 404 })
        const allJobs = await fetchJobs(config)
        const groupName = group.name.toLowerCase()
        const groupJobs = allJobs.filter(j => j.name.toLowerCase().includes(groupName.split(' ')[0]))
        return Response.json(groupJobs)
      }

      const batchMatch = pathname.match(/^\/api\/batches\/([^/]+)$/)
      if (batchMatch) {
        const batch = await fetchBatchById(config, batchMatch[1])
        if (!batch)
          return Response.json({ error: 'Batch not found' }, { status: 404 })
        return Response.json(batch)
      }

      const batchJobsMatch = pathname.match(/^\/api\/batches\/([^/]+)\/jobs$/)
      if (batchJobsMatch) {
        const batch = await fetchBatchById(config, batchJobsMatch[1])
        if (!batch)
          return Response.json({ error: 'Batch not found' }, { status: 404 })
        const allJobs = await fetchJobs(config)
        return Response.json(allJobs.slice(0, batch.totalJobs > 10 ? 10 : batch.totalJobs))
      }

      // Shared functions bundle
      if (pathname === '/bq-utils.js') {
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

      if (pageMap[pathname]) {
        return renderStxPage(pageMap[pathname], wsUrl, req)
      }

      // Dynamic page routes (detail views)
      const dynamicPages: Array<{ pattern: RegExp, template: string }> = [
        { pattern: /^\/queues\/[^/]+$/, template: 'queue-details' },
        { pattern: /^\/jobs\/[^/]+$/, template: 'job-details' },
        { pattern: /^\/batches\/[^/]+$/, template: 'batch-details' },
        { pattern: /^\/groups\/[^/]+$/, template: 'group-details' },
      ]

      for (const { pattern, template } of dynamicPages) {
        if (pattern.test(pathname)) {
          return renderStxPage(template, wsUrl, req)
        }
      }

      return new Response('Not Found', { status: 404 })
    },
  })

  // eslint-disable-next-line no-console
  console.log(`bun-queue dashboard running at http://${server.hostname}:${server.port}`)
  // eslint-disable-next-line no-console
  console.log(`WebSocket broadcast server running at ws://localhost:${broadcastPort}/app`)
}
