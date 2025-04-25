import type { QueueConfig } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: QueueConfig = {
  verbose: true,
  logLevel: 'info',
  prefix: 'queue',
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: false,
    removeOnFail: false,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    keepJobs: false,
  },
  metrics: {
    enabled: true,
    collectInterval: 30000, // 30 seconds
  },
  stalledJobCheckInterval: 30000, // Check for stalled jobs every 30 seconds
  maxStalledJobRetries: 3,
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: QueueConfig = await loadConfig({
  name: 'queue',
  defaultConfig,
})
