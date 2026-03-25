import { createApiRoutes, resolveConfig } from './src/api'

// Load dashboard config from environment or defaults
const config = resolveConfig({})
const apiRoutes = createApiRoutes(config)

export default {
  componentsDir: 'components',
  partialsDir: 'partials',
  apiRoutes,
}
