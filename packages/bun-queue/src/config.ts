import type { QueueConfig } from './types'
import { loadConfig } from 'bunfig'

const defaultConfig: QueueConfig = {
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

// Load unified config using bunfig
// Lazy-loaded config to avoid top-level await (enables bun --compile)
let _config: QueueConfig | null = null

export async function getConfig(): Promise<QueueConfig> {
  if (!_config) {
    _config = await loadConfig({
      name: 'queue',
      defaultConfig,
    })
  }
  return _config
}

// For backwards compatibility - synchronous access with default fallback
export const config: QueueConfig = defaultConfig
