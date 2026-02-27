import { describe, expect, it } from 'bun:test'
import { createApiRoutes, fetchBatches, fetchDashboardStats, fetchDependencyGraph, fetchJobGroups, fetchJobs, fetchMetrics, fetchQueues, resolveConfig } from '../src/api'
import { JobStatus } from '../src/types'

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
    it('should create all API route handlers', () => {
      const routes = createApiRoutes({})
      expect(routes['/api/stats']).toBeDefined()
      expect(routes['/api/queues']).toBeDefined()
      expect(routes['/api/queues/metrics']).toBeDefined()
      expect(routes['/api/jobs']).toBeDefined()
      expect(routes['/api/groups']).toBeDefined()
      expect(routes['/api/batches']).toBeDefined()
      expect(routes['/api/dependencies']).toBeDefined()
      expect(routes['/api/metrics']).toBeDefined()
    })

    it('should return JSON from stats endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/stats']()
      expect(response).toBeInstanceOf(Response)
      const data = await response.json()
      expect(data).toHaveProperty('totalQueues')
      expect(data).toHaveProperty('totalJobs')
      expect(data).toHaveProperty('activeJobs')
      expect(data).toHaveProperty('completedJobs')
      expect(data).toHaveProperty('failedJobs')
      expect(data).toHaveProperty('throughputPerMinute')
      expect(data).toHaveProperty('avgLatency')
    })

    it('should return JSON array from queues endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/queues']()
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('status')
    })

    it('should return JSON array from jobs endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/jobs'](new Request('http://localhost/api/jobs'))
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    it('should return JSON array from groups endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/groups']()
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('name')
      expect(data[0]).toHaveProperty('jobCount')
    })

    it('should return JSON array from batches endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/batches']()
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0]).toHaveProperty('progress')
      expect(data[0]).toHaveProperty('status')
    })

    it('should return dependency graph from dependencies endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/dependencies']()
      const data = await response.json()
      expect(data).toHaveProperty('nodes')
      expect(data).toHaveProperty('links')
      expect(Array.isArray(data.nodes)).toBe(true)
      expect(Array.isArray(data.links)).toBe(true)
    })

    it('should return metrics from metrics endpoint', async () => {
      const routes = createApiRoutes({})
      const response = await routes['/api/metrics'](new Request('http://localhost/api/metrics?timeRange=24h'))
      const data = await response.json()
      expect(data).toHaveProperty('throughput')
      expect(data).toHaveProperty('latency')
      expect(data).toHaveProperty('errorRate')
      expect(data).toHaveProperty('timestamps')
      expect(data.throughput.length).toBe(24)
    })
  })

  describe('fetch functions', () => {
    it('fetchQueues should return mock queues', async () => {
      const queues = await fetchQueues({})
      expect(queues.length).toBe(7)
      expect(queues[0].name).toBe('Email Queue')
    })

    it('fetchJobs should return mock jobs', async () => {
      const jobs = await fetchJobs({})
      expect(jobs.length).toBe(12)
    })

    it('fetchJobs should filter by status', async () => {
      const completed = await fetchJobs({}, undefined, JobStatus.COMPLETED)
      expect(completed.every(j => j.status === JobStatus.COMPLETED)).toBe(true)

      const failed = await fetchJobs({}, undefined, JobStatus.FAILED)
      expect(failed.every(j => j.status === JobStatus.FAILED)).toBe(true)
    })

    it('fetchJobs should filter by queue', async () => {
      const emailJobs = await fetchJobs({}, 'Email')
      expect(emailJobs.every(j => j.queue.includes('Email'))).toBe(true)
    })

    it('fetchJobGroups should return mock groups', async () => {
      const groups = await fetchJobGroups({})
      expect(groups.length).toBe(5)
    })

    it('fetchBatches should return mock batches', async () => {
      const batches = await fetchBatches({})
      expect(batches.length).toBe(5)
    })

    it('fetchDependencyGraph should return nodes and links', async () => {
      const graph = await fetchDependencyGraph({})
      expect(graph.nodes.length).toBe(8)
      expect(graph.links.length).toBe(8)
    })

    it('fetchMetrics should generate data for different time ranges', async () => {
      const h24 = await fetchMetrics({}, '24h')
      expect(h24.timestamps.length).toBe(24)

      const d7 = await fetchMetrics({}, '7d')
      expect(d7.timestamps.length).toBe(7)

      const d30 = await fetchMetrics({}, '30d')
      expect(d30.timestamps.length).toBe(30)
    })

    it('fetchDashboardStats should aggregate from queues', async () => {
      const stats = await fetchDashboardStats({})
      expect(stats.totalQueues).toBeGreaterThan(0)
      expect(stats.totalJobs).toBeGreaterThan(0)
      expect(stats.throughputPerMinute).toBe(64)
    })
  })
})
