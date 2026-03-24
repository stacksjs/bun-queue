import type { DashboardConfig } from './types'
import path from 'node:path'
import { defaultConfig as stxDefaultConfig, isSpaNavigation, processDirectives, stripDocumentWrapper } from '@stacksjs/stx'
import { BroadcastServer } from 'ts-broadcasting'
import { createApiRoutes, fetchBatchById, fetchJobById, fetchJobGroups, fetchJobs, fetchQueueById } from './api'
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
  const result = await Bun.build({ entrypoints: [FUNCTIONS_ENTRY], target: 'browser', minify: false, format: 'iife' })
  if (!result.success) { console.error('Failed to build functions bundle:', result.logs); return '' } // eslint-disable-line no-console
  bundledFunctionsJs = await result.outputs[0].text()
  return bundledFunctionsJs
}

async function renderPage(templateName: string, wsUrl: string, req: Request): Promise<Response> {
  const templatePath = path.join(PAGES_DIR, `${templateName}.stx`)
  const content = await Bun.file(templatePath).text()
  const context: Record<string, any> = { __filename: templatePath, __dirname: path.dirname(templatePath) }

  // SPA navigation — process page as fragment (strip layout directives)
  if (isSpaNavigation(req)) {
    const pageContent = content
      .replace(/@extends\s*\(\s*['"][^'"]+['"]\s*\)/g, '')
      .replace(/@section\s*\(\s*'title'\s*\)[^@]*@endsection/g, '')
      .replace(/@section\s*\(\s*'content'\s*\)/g, '')
      .replace(/@endsection\s*$/gm, '')
      .replace(/@push\s*\(\s*['"][^'"]+['"]\s*\)/g, '')
      .replace(/@endpush/g, '')

    let fragment = await processDirectives(pageContent, context, templatePath, stxConfig, new Set())
    fragment = stripDocumentWrapper(fragment)
    // Strip signals runtime — shell already has it
    fragment = fragment.replace(/<script data-stx-scoped>\(function\(\)\{[^]*?<\/script>/, '')

    return new Response(fragment, {
      headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store', 'X-STX-Fragment': 'true' },
    })
  }

  // Full page — processDirectives handles @extends, layout, signals runtime, everything
  let html = await processDirectives(content, context, templatePath, stxConfig, new Set())
  html = html.replace('</head>', `<script>window.__BQ_WS_URL = "${wsUrl}";</script>\n</head>`)
  return new Response(html, { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' } })
}

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

function handleDynamicApiRoute(pathname: string, req: Request, config: DashboardConfig): Promise<Response> | null {
  const queueMatch = pathname.match(/^\/api\/queues\/([^/]+)$/)
  if (queueMatch) return fetchQueueById(config, queueMatch[1]).then(q => q ? Response.json(q) : Response.json({ error: 'Queue not found' }, { status: 404 }))

  const retryMatch = pathname.match(/^\/api\/jobs\/([^/]+)\/retry$/)
  if (retryMatch && req.method === 'POST') {
    const jobId = decodeURIComponent(retryMatch[1])
    const qs = config.queues?.length ? config.queues : config.queueManager ? (() => { const arr: any[] = []; for (const c of config.queueManager!.getConnections()) { try { const conn = config.queueManager!.connection(c); for (const q of conn.queues.values()) arr.push(q) } catch {} } return arr })() : []
    return (async () => { for (const q of qs) { try { const r = await q.retryJob(jobId); if (r) return Response.json({ success: true }) } catch {} } return Response.json({ success: false }) })()
  }

  const deleteMatch = pathname.match(/^\/api\/jobs\/([^/]+)$/)
  if (deleteMatch && req.method === 'DELETE') {
    const jobId = decodeURIComponent(deleteMatch[1])
    const qs = config.queues?.length ? config.queues : config.queueManager ? (() => { const arr: any[] = []; for (const c of config.queueManager!.getConnections()) { try { const conn = config.queueManager!.connection(c); for (const q of conn.queues.values()) arr.push(q) } catch {} } return arr })() : []
    return (async () => { for (const q of qs) { try { await q.removeJob(jobId); return Response.json({ success: true }) } catch {} } return Response.json({ success: false }) })()
  }

  const jobMatch = pathname.match(/^\/api\/jobs\/([^/]+)$/)
  if (jobMatch && req.method === 'GET') return fetchJobById(config, jobMatch[1]).then(j => j ? Response.json(j) : Response.json({ error: 'Job not found' }, { status: 404 }))

  const groupMatch = pathname.match(/^\/api\/groups\/([^/]+)$/)
  if (groupMatch) return fetchJobGroups(config).then(groups => { const g = groups.find(x => x.id === groupMatch[1]); return g ? Response.json(g) : Response.json({ error: 'Group not found' }, { status: 404 }) })

  const groupJobsMatch = pathname.match(/^\/api\/groups\/([^/]+)\/jobs$/)
  if (groupJobsMatch) return fetchJobGroups(config).then(async (groups) => { const g = groups.find(x => x.id === groupJobsMatch[1]); if (!g) return Response.json({ error: 'Group not found' }, { status: 404 }); const allJobs = await fetchJobs(config); return Response.json(allJobs.filter(j => j.name.toLowerCase().includes(g.name.toLowerCase().split(' ')[0]))) })

  const batchMatch = pathname.match(/^\/api\/batches\/([^/]+)$/)
  if (batchMatch) return fetchBatchById(config, batchMatch[1]).then(b => b ? Response.json(b) : Response.json({ error: 'Batch not found' }, { status: 404 }))

  const batchJobsMatch = pathname.match(/^\/api\/batches\/([^/]+)\/jobs$/)
  if (batchJobsMatch) return fetchBatchById(config, batchJobsMatch[1]).then(async (b) => { if (!b) return Response.json({ error: 'Batch not found' }, { status: 404 }); const allJobs = await fetchJobs(config); return Response.json(allJobs.slice(0, b.totalJobs > 10 ? 10 : b.totalJobs)) })

  return null
}

export async function serveDashboard(options: DashboardConfig = {}): Promise<void> {
  const config = resolveConfig(options)
  const apiRoutes = createApiRoutes(config)

  const broadcastPort = options.broadcastPort || 6001
  broadcastServer = new BroadcastServer({ connections: { default: { driver: 'bun', host: '0.0.0.0', port: broadcastPort } }, default: 'default', debug: false })
  await broadcastServer.start()

  const allQueues = config.queues || []
  if (allQueues.length) wireQueueEvents(allQueues)

  const wsUrl = `ws://localhost:${broadcastPort}/app`

  const pageMap: Record<string, string> = {
    '/': 'index', '/monitoring': 'monitoring', '/metrics': 'metrics', '/queues': 'queues',
    '/jobs': 'jobs', '/batches': 'batches', '/groups': 'groups', '/dependencies': 'dependencies',
  }
  const dynamicPages = [
    { pattern: /^\/queues\/[^/]+$/, template: 'queue-details' },
    { pattern: /^\/jobs\/[^/]+$/, template: 'job-details' },
    { pattern: /^\/batches\/[^/]+$/, template: 'batch-details' },
    { pattern: /^\/groups\/[^/]+$/, template: 'group-details' },
  ]

  Bun.serve({
    port: config.port,
    hostname: config.host,
    async fetch(req: Request) {
      const pathname = new URL(req.url).pathname

      // Static API routes
      const apiHandler = apiRoutes[pathname as keyof typeof apiRoutes]
      if (apiHandler) return apiHandler(req)

      // Dynamic API routes
      const dynamicApi = handleDynamicApiRoute(pathname, req, config)
      if (dynamicApi) return dynamicApi

      // Shared functions bundle
      if (pathname === '/bq-utils.js') {
        const js = await buildFunctionsBundle()
        return new Response(js, { headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store' } })
      }

      // Page routes
      if (pageMap[pathname]) return renderPage(pageMap[pathname], wsUrl, req)
      for (const { pattern, template } of dynamicPages) {
        if (pattern.test(pathname)) return renderPage(template, wsUrl, req)
      }

      return new Response('Not Found', { status: 404 })
    },
  })

  console.log(`bun-queue dashboard running at http://localhost:${config.port}`) // eslint-disable-line no-console
  console.log(`WebSocket broadcast server running at ws://localhost:${broadcastPort}/app`) // eslint-disable-line no-console
}
