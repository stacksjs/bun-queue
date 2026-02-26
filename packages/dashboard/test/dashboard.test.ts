import { describe, expect, it } from 'bun:test'
import { createApiRoutes, resolveConfig } from '../src/api'
import type { DashboardConfig } from '../src/types'

describe('bun-queue-dashboard', () => {
  describe('resolveConfig', () => {
    it('should use default values when no config provided', () => {
      const config = resolveConfig({})
      expect(config.port).toBe(4400)
      expect(config.host).toBe('localhost')
      expect(config.refreshInterval).toBe(5000)
    })

    it('should allow overriding defaults', () => {
      const config = resolveConfig({ port: 9000, host: '0.0.0.0' })
      expect(config.port).toBe(9000)
      expect(config.host).toBe('0.0.0.0')
    })
  })

  describe('createApiRoutes', () => {
    it('should create API route handlers', () => {
      const routes = createApiRoutes({})
      expect(routes['/api/stats']).toBeDefined()
      expect(routes['/api/queues']).toBeDefined()
      expect(routes['/api/jobs']).toBeDefined()
    })

    it('should return JSON from stats endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/stats']()
      expect(response).toBeInstanceOf(Response)
      const data = await response.json()
      expect(data).toHaveProperty('totalQueues')
      expect(data).toHaveProperty('totalJobs')
    })

    it('should return JSON from queues endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/queues']()
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })
})
