import type { DashboardConfig } from './types'
import { createApiRoutes, resolveConfig } from './api'

export type { DashboardConfig, DashboardStats, JobData, JobStatus, QueueMetrics } from './types'
export { createApiRoutes, fetchDashboardStats, fetchJobs, fetchQueueMetrics } from './api'

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

      // Serve dashboard pages
      // TODO: Integrate stx template rendering for page routes
      if (path === '/' || path === '/index') {
        return new Response('bun-queue dashboard', {
          headers: { 'Content-Type': 'text/html' },
        })
      }

      return new Response('Not Found', { status: 404 })
    },
  })

  console.log(`bun-queue dashboard running at http://${server.hostname}:${server.port}`)
}
