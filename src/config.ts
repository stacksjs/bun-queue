import type { QueueConfig } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: QueueConfig = {
  verbose: true,
  prefix: 'queue',
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: false,
    removeOnFail: false,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: QueueConfig = await loadConfig({
  name: 'queue',
  defaultConfig,
})
