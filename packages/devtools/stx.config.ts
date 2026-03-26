import { createApiRoutes, resolveConfig } from './src/api'

// Load dashboard config from environment or defaults
const config = resolveConfig({})
const apiRoutes = createApiRoutes(config)

export default {
  componentsDir: 'components',
  partialsDir: 'partials',
  app: {
    head: {
      title: 'bun-queue Dashboard',
      meta: [
        { name: 'description', content: 'bun-queue job queue dashboard' },
      ],
      scripts: [
        { src: 'https://cdn.jsdelivr.net/npm/chart.js@4', defer: true },
        { src: 'https://cdn.jsdelivr.net/npm/d3@7', defer: true },
      ],
      bodyClass: 'bg-[#0a0a0f] text-zinc-50 leading-relaxed min-h-screen',
    },
  },
  apiRoutes,
}
