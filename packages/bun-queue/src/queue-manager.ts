import type { Queue as QueueInstance } from './queue'
import type { QueueConnectionConfig, QueueManagerConfig } from './types'
import { config } from './config'
import { Queue } from './queue'

// Convert simple QueueConfig to QueueManagerConfig
function createDefaultManagerConfig(): QueueManagerConfig {
  return {
    default: 'redis',
    connections: {
      redis: {
        driver: 'redis',
        ...config,
      } as QueueConnectionConfig,
      memory: {
        driver: 'memory',
        prefix: 'test_queues',
        defaultJobOptions: {
          attempts: 1,
        },
      } as QueueConnectionConfig,
    },
    failed: {
      driver: 'redis',
      prefix: 'failed_jobs',
    },
    batching: {
      driver: 'redis',
      prefix: 'job_batches',
    },
  }
}

export interface QueueConnection {
  name: string
  config: QueueConnectionConfig
  queues: Map<string, QueueInstance<any>>

  queue: <T = any>(name?: string) => QueueInstance<T>
}

export class QueueManager {
  private connections: Map<string, QueueConnection> = new Map()
  private config: QueueManagerConfig

  constructor(managerConfig?: Partial<QueueManagerConfig>) {
    const defaultManagerConfig = createDefaultManagerConfig()
    this.config = {
      ...defaultManagerConfig,
      ...managerConfig,
      connections: {
        ...defaultManagerConfig.connections,
        ...managerConfig?.connections,
      },
    }
  }

  connection(name?: string): QueueConnection {
    const connectionName = name || this.config.default!

    if (!this.connections.has(connectionName)) {
      const connectionConfig = this.config.connections?.[connectionName]
      if (!connectionConfig) {
        throw new Error(`Queue connection "${connectionName}" is not configured`)
      }

      const connection: QueueConnection = {
        name: connectionName,
        config: connectionConfig,
        queues: new Map(),

        queue<T = any>(queueName?: string): QueueInstance<T> {
          const name = queueName || 'default'

          if (!this.queues.has(name)) {
            // Use Queue with enhanced job class support
            const queue = new Queue<T>(name, this.config)
            this.queues.set(name, queue)
          }

          return this.queues.get(name)!
        },
      }

      this.connections.set(connectionName, connection)
    }

    return this.connections.get(connectionName)!
  }

  queue<T = any>(name?: string): QueueInstance<T> {
    return this.connection().queue<T>(name)
  }

  async closeAll(): Promise<void> {
    const closePromises: Promise<void>[] = []

    for (const connection of this.connections.values()) {
      for (const queue of connection.queues.values()) {
        closePromises.push(queue.close())
      }
    }

    await Promise.all(closePromises)
    this.connections.clear()
  }

  getConnections(): string[] {
    return Object.keys(this.config.connections || {})
  }

  addConnection(name: string, config: QueueConnectionConfig): void {
    if (!this.config.connections) {
      this.config.connections = {}
    }
    this.config.connections[name] = config
  }

  removeConnection(name: string): void {
    if (this.connections.has(name)) {
      const connection = this.connections.get(name)!
      // Close all queues in this connection
      for (const queue of connection.queues.values()) {
        queue.close()
      }
      this.connections.delete(name)
    }
    if (this.config.connections) {
      delete this.config.connections[name]
    }
  }

  setDefaultConnection(name: string): void {
    if (!this.config.connections?.[name]) {
      throw new Error(`Queue connection "${name}" is not configured`)
    }
    this.config.default = name
  }

  getDefaultConnection(): string {
    return this.config.default || 'redis'
  }
}

// Global queue manager instance
let globalQueueManager: QueueManager | null = null

export function getQueueManager(config?: Partial<QueueManagerConfig>): QueueManager {
  if (!globalQueueManager) {
    globalQueueManager = new QueueManager(config)
  }
  return globalQueueManager
}

export function setQueueManager(manager: QueueManager): void {
  globalQueueManager = manager
}

export async function closeQueueManager(): Promise<void> {
  if (globalQueueManager) {
    await globalQueueManager.closeAll()
    globalQueueManager = null
  }
}
