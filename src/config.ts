import type { QueueConfig } from './types'
import { loadConfig } from 'bunfig'

export const defaultConfig: QueueConfig = {
  verbose: true,
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: QueueConfig = await loadConfig({
  name: 'queue',
  defaultConfig,
})
