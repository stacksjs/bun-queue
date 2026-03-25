#!/usr/bin/env bun
/**
 * Devtools dev server
 *
 * Uses bun-plugin-stx/serve for page rendering + SPA routing.
 * API routes are passed to the stx serve layer.
 */

import { serve } from 'bun-plugin-stx/serve'
import { createApiRoutes } from './src/api'
import type { DashboardConfig } from './src/types'
import { fetchBatchById, fetchJobById, fetchJobGroups, fetchJobs, fetchQueueById } from './src/api'

const args = process.argv.slice(2)
const portIdx = args.indexOf('--port')
const port = portIdx >= 0 && args[portIdx + 1] ? Number(args[portIdx + 1]) : 4400

const dashboardConfig: DashboardConfig = {
  port,
  host: 'localhost',
}

const apiHandlers = createApiRoutes(dashboardConfig)

// Build exact-match routes for stx serve
const routes: Record<string, (req: Request) => Response | Promise<Response>> = {
  '/api/stats': req => apiHandlers['/api/stats'](req),
  '/api/queues': req => apiHandlers['/api/queues'](req),
  '/api/queues/metrics': req => apiHandlers['/api/queues/metrics'](req),
  '/api/jobs': req => apiHandlers['/api/jobs'](req),
  '/api/groups': req => apiHandlers['/api/groups'](req),
  '/api/batches': req => apiHandlers['/api/batches'](req),
  '/api/dependencies': req => apiHandlers['/api/dependencies'](req),
  '/api/metrics': req => apiHandlers['/api/metrics'](req),
}

// Handle parameterized API routes
function onRequest(req: Request): Response | Promise<Response> | null {
  const url = new URL(req.url)
  const pathname = url.pathname

  const queueMatch = pathname.match(/^\/api\/queues\/([^/]+)$/)
  if (queueMatch && !pathname.includes('/metrics')) {
    return fetchQueueById(dashboardConfig, queueMatch[1]).then(q =>
      q ? Response.json(q) : Response.json({ error: 'Queue not found' }, { status: 404 }),
    )
  }

  const jobMatch = pathname.match(/^\/api\/jobs\/([^/]+)$/)
  if (jobMatch && req.method === 'GET') {
    return fetchJobById(dashboardConfig, jobMatch[1]).then(j =>
      j ? Response.json(j) : Response.json({ error: 'Job not found' }, { status: 404 }),
    )
  }

  const groupMatch = pathname.match(/^\/api\/groups\/([^/]+)$/)
  if (groupMatch) {
    return fetchJobGroups(dashboardConfig).then((groups) => {
      const g = groups.find(x => x.id === groupMatch[1])
      return g ? Response.json(g) : Response.json({ error: 'Group not found' }, { status: 404 })
    })
  }

  const batchMatch = pathname.match(/^\/api\/batches\/([^/]+)$/)
  if (batchMatch) {
    return fetchBatchById(dashboardConfig, batchMatch[1]).then(b =>
      b ? Response.json(b) : Response.json({ error: 'Batch not found' }, { status: 404 }),
    )
  }

  return null
}

await serve({
  patterns: ['pages/'],
  port,
  routes,
  onRequest,
})
