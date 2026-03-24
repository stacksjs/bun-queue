import { createApiRoutes, resolveConfig } from './src/api'

// Load dashboard config from environment or defaults
const config = resolveConfig({})
const apiRoutes = createApiRoutes(config)

export default {
  componentsDir: 'src/components',
  partialsDir: 'src/partials',
  shell: 'src/app.stx',
  apiRoutes,
}
