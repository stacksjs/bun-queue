import type { Cluster, Redis } from 'ioredis'
import type { EventEmitter } from 'node:events'

export type RedisClient = Redis | Cluster

export interface IConnection extends EventEmitter {
  waitUntilReady: () => Promise<boolean>
  client: Promise<RedisClient>
}
