import type { QueueConfig } from './packages/bun-queue/src/types'

// Standard queue configuration (existing bunfig approach) - default export for auto-loading
export default {
  verbose: true,
  logLevel: 'info',
  prefix: 'bun_queues',
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    timeout: 30000,
    removeOnComplete: true,
    removeOnFail: false,
    keepJobs: false,
  },
  metrics: {
    enabled: true,
    collectInterval: 30000,
  },
  stalledJobCheckInterval: 30000,
  maxStalledJobRetries: 3,
  distributedLock: true,
} satisfies QueueConfig