import type { DashboardConfig } from './types'
import path from 'node:path'
import { defaultConfig as stxDefaultConfig, generateSignalsRuntime, injectRouterScript, isSpaNavigation, processDirectives, stripDocumentWrapper } from '@stacksjs/stx'
import { BroadcastServer } from 'ts-broadcasting'
import { createApiRoutes, fetchBatchById, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobById, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueueById, fetchQueues } from './api'
import { resolveConfig } from './api'

export type { Batch, DashboardConfig, DashboardStats, DependencyGraph, DependencyNode, JobData, JobGroup, MetricsData, Queue, QueueMetrics } from './types'
export { JobStatus } from './types'
export { createApiRoutes, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueueMetrics, fetchQueues } from './api'

const SRC_DIR = import.meta.dir
const PAGES_DIR = path.join(SRC_DIR, 'pages')
const FUNCTIONS_ENTRY = path.join(SRC_DIR, 'functions', 'browser.ts')
const SHELL_PATH = path.join(SRC_DIR, 'app.stx')

let broadcastServer: BroadcastServer | null = null
let bundledFunctionsJs: string | null = null
let cachedShell: { before: string, after: string, styles: string, scripts: string } | null = null
let cachedRouterScript: string | null = null

function getRouterScriptTag(): string {
  if (cachedRouterScript) return cachedRouterScript
  // Extract the router script by injecting into a minimal HTML doc
  const minimal = '<!DOCTYPE html><html><head></head><body></body></html>'
  const injected = injectRouterScript(minimal)
  const match = injected.match(/<script>[\s\S]*?__stxRouter[\s\S]*?<\/script>/)
  cachedRouterScript = match ? match[0] : ''
  return cachedRouterScript
}

const pageTitles: Record<string, string> = {
  'index': 'bun-queue Dashboard',
  'monitoring': 'Real-time Monitoring — bun-queue',
  'metrics': 'Performance Metrics — bun-queue',
  'queues': 'Queues — bun-queue',
  'queue-details': 'Queue Details — bun-queue',
  'jobs': 'Jobs — bun-queue',
  'job-details': 'Job Details — bun-queue',
  'batches': 'Batches — bun-queue',
  'batch-details': 'Batch Details — bun-queue',
  'groups': 'Job Groups — bun-queue',
  'group-details': 'Group Details — bun-queue',
  'dependencies': 'Job Dependencies — bun-queue',
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
    console.error('Failed to build functions bundle:', result.logs)
    return ''
  }

  bundledFunctionsJs = await result.outputs[0].text()
  return bundledFunctionsJs
}

const stxConfig = {
  ...stxDefaultConfig,
  componentsDir: path.join(SRC_DIR, 'components'),
  partialsDir: path.join(SRC_DIR, 'partials'),
}

async function getShellParts(): Promise<{ before: string, after: string, styles: string, scripts: string, signalsRuntime: string }> {
  if (cachedShell) return cachedShell

  const shellContent = await Bun.file(SHELL_PATH).text()

  // Extract <template> block
  const templateMatch = shellContent.match(/<template\b[^>]*>([\s\S]*?)<\/template>/i)
  let shellTemplate = templateMatch ? templateMatch[1].trim() : shellContent

  // Extract <style> blocks from the full file
  const styles = (shellContent.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n')

  // Extract <script client> blocks, process them through stx for TypeScript transpilation
  const clientScriptMatches = shellContent.match(/<script\b[^>]*\bclient\b[^>]*>[\s\S]*?<\/script>/gi) || []
  let scripts = ''
  if (clientScriptMatches.length > 0) {
    const scriptHtml = clientScriptMatches.join('\n')
    const scriptContext = { __filename: SHELL_PATH, __dirname: path.dirname(SHELL_PATH) }
    // Skip runtime here too — we extract it separately
    scripts = await processDirectives(scriptHtml, scriptContext, SHELL_PATH, { ...stxConfig, skipSignalsRuntime: true }, new Set())
    scripts = stripDocumentWrapper(scripts)
  }

  // Remove scripts and styles from template for processing
  shellTemplate = shellTemplate.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  shellTemplate = shellTemplate.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')

  // Replace <slot /> with placeholder
  const SLOT = '<!--__STX_SLOT__-->'
  shellTemplate = shellTemplate.replace(/<slot\s*\/>/gi, SLOT).replace(/<slot\s*>\s*<\/slot>/gi, SLOT)

  // Process shell template WITHOUT signals runtime — we'll place it in <head> ourselves
  const context = { __filename: SHELL_PATH, __dirname: path.dirname(SHELL_PATH) }
  let processed = await processDirectives(shellTemplate, context, SHELL_PATH, { ...stxConfig, skipSignalsRuntime: true }, new Set())
  processed = stripDocumentWrapper(processed)

  // Get the signals runtime directly
  const signalsRuntime = `<script data-stx-scoped>${generateSignalsRuntime()}</script>`

  const slotIdx = processed.indexOf(SLOT)
  if (slotIdx === -1) {
    console.warn('[bq-devtools] Shell has no <slot /> — falling back')
    cachedShell = { before: '', after: '', styles, scripts, signalsRuntime }
    return cachedShell
  }

  cachedShell = {
    before: processed.substring(0, slotIdx),
    after: processed.substring(slotIdx + SLOT.length),
    styles,
    scripts,
    signalsRuntime,
  }
  return cachedShell
}

async function renderStxPage(templateName: string, wsUrl: string, req: Request): Promise<Response> {
  const templatePath = path.join(PAGES_DIR, `${templateName}.stx`)
  const content = await Bun.file(templatePath).text()

  const context = { __filename: templatePath, __dirname: path.dirname(templatePath) }
  let pageHtml = await processDirectives(content, context, templatePath, stxConfig, new Set())
  pageHtml = stripDocumentWrapper(pageHtml)

  // Strip the signals runtime from page fragment — the shell already provides it in <head>
  pageHtml = pageHtml.replace(/<script data-stx-scoped>\(function\(\)\{'use strict';var cloakStyle[\s\S]*?<\/script>/, '')

  // Extract the SFC setup function name so we can bind it to the content wrapper
  const setupMatch = pageHtml.match(/function (__stx_setup_\w+)/)
  const pageSetupName = setupMatch ? setupMatch[1] : null

  // SPA navigation — return fragment only
  if (isSpaNavigation(req)) {
    return new Response(pageHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
        'X-STX-Fragment': 'true',
      },
    })
  }

  // Full page request — compose with shell
  const shell = await getShellParts()
  const title = pageTitles[templateName] || 'bun-queue'

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="/bq-utils.js"><\/script>
  <script>window.__BQ_WS_URL = "${wsUrl}";window.__stxRouterConfig={container:'[data-stx-content]'};<\/script>
  ${shell.styles}
  ${shell.signalsRuntime}
</head>
<body class="bg-[#0a0a0f] text-zinc-50 leading-relaxed min-h-screen">
${shell.before}
<div data-stx-content${pageSetupName ? ` data-stx="${pageSetupName}"` : ''}>${pageHtml}</div>
${shell.after}
${shell.scripts}
${getRouterScriptTag()}
</body>
</html>`

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

  // Pre-process the app shell at startup
  await getShellParts()

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

  console.log(`bun-queue dashboard running at http://${server.hostname}:${server.port}`)
  console.log(`WebSocket broadcast server running at ws://localhost:${broadcastPort}/app`)
}
