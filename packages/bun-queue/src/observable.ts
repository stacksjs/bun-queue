import type { RedisClient } from 'bun'
import type { Queue } from './queue'
import type { Observable, ObservableOptions } from './types'
import { createLogger } from './logger'
import { generateId } from './utils'

export class QueueObservable {
  private readonly redisClient: RedisClient
  private readonly queues: Map<string, Queue<any>> = new Map()
  private readonly observables: Map<string, Observable> = new Map()
  private readonly timers: Map<string, NodeJS.Timeout> = new Map()
  private readonly prefix: string
  private readonly logger = createLogger()

  constructor(prefix: string, redisClient: RedisClient) {
    this.prefix = prefix
    this.redisClient = redisClient
  }

  /**
   * Create a new observable for a set of queues
   */
  async createObservable(queues: Queue<any>[], options?: ObservableOptions): Promise<Observable> {
    const observableId = generateId()
    const queueNames = queues.map(q => q.name)

    // Default options
    const interval = options?.interval || 5000

    // Create observable metadata
    const observable: Observable = {
      id: observableId,
      queues: queueNames,
      interval,
      running: false,
    }

    // Add observable to Redis
    await this.redisClient.send('HMSET', [
      this.getObservableKey(observableId),
      'id',
      observableId,
      'queues',
      JSON.stringify(queueNames),
      'interval',
      interval.toString(),
      'running',
      'false',
    ])

    // Add queues to local map
    for (const queue of queues) {
      this.queues.set(queue.name, queue)
    }

    // Add observable to local map
    this.observables.set(observableId, observable)

    // Start the observable if autoStart is true
    if (options?.autoStart) {
      await this.startObservable(observableId)
    }

    return observable
  }

  /**
   * Start an observable
   */
  async startObservable(observableId: string): Promise<void> {
    const observable = this.observables.get(observableId)

    if (!observable) {
      throw new Error(`Observable ${observableId} not found`)
    }

    if (observable.running) {
      this.logger.warn(`Observable ${observableId} is already running`)
      return
    }

    // Update observable status in Redis
    await this.redisClient.send('HSET', [
      this.getObservableKey(observableId),
      'running',
      'true',
    ])

    // Update local state
    observable.running = true
    this.observables.set(observableId, observable)

    // Start monitoring
    this.startMonitoring(observableId)

    // Emit observable started event
    for (const queueName of observable.queues) {
      const queue = this.queues.get(queueName)
      if (queue) {
        queue.events.emit('observableStarted', observableId)
      }
    }

    this.logger.info(`Started observable ${observableId} for queues: ${observable.queues.join(', ')}`)
  }

  /**
   * Stop an observable
   */
  async stopObservable(observableId: string): Promise<void> {
    const observable = this.observables.get(observableId)

    if (!observable) {
      throw new Error(`Observable ${observableId} not found`)
    }

    if (!observable.running) {
      this.logger.warn(`Observable ${observableId} is already stopped`)
      return
    }

    // Update observable status in Redis
    await this.redisClient.send('HSET', [
      this.getObservableKey(observableId),
      'running',
      'false',
    ])

    // Stop the timer
    const timer = this.timers.get(observableId)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(observableId)
    }

    // Update local state
    observable.running = false
    this.observables.set(observableId, observable)

    // Emit observable stopped event
    for (const queueName of observable.queues) {
      const queue = this.queues.get(queueName)
      if (queue) {
        queue.events.emit('observableStopped', observableId)
      }
    }

    this.logger.info(`Stopped observable ${observableId}`)
  }

  /**
   * Remove an observable
   */
  async removeObservable(observableId: string): Promise<void> {
    // Stop the observable if it's running
    const observable = this.observables.get(observableId)
    if (observable?.running) {
      await this.stopObservable(observableId)
    }

    // Remove from Redis
    await this.redisClient.send('DEL', [this.getObservableKey(observableId)])

    // Remove from local map
    this.observables.delete(observableId)

    this.logger.info(`Removed observable ${observableId}`)
  }

  /**
   * Get all observables
   */
  async getAllObservables(): Promise<Observable[]> {
    const keys = await this.redisClient.send('KEYS', [`${this.prefix}:observable:*`])
    const observables: Observable[] = []

    if (!keys || keys.length === 0) {
      return observables
    }

    for (const key of keys) {
      const observableId = key.split(':').pop()
      if (observableId) {
        const observable = await this.getObservable(observableId)
        if (observable) {
          observables.push(observable)
        }
      }
    }

    return observables
  }

  /**
   * Get an observable by id
   */
  async getObservable(observableId: string): Promise<Observable | null> {
    const data = await this.redisClient.send('HGETALL', [this.getObservableKey(observableId)])

    if (!data || Object.keys(data).length === 0) {
      return null
    }

    return {
      id: observableId,
      queues: JSON.parse(data.queues || '[]'),
      interval: Number.parseInt(data.interval || '5000'),
      running: data.running === 'true',
    }
  }

  /**
   * Start monitoring queues with an observable
   */
  private startMonitoring(observableId: string): void {
    const observable = this.observables.get(observableId)

    if (!observable || !observable.running) {
      return
    }

    const monitor = async () => {
      if (!this.observables.has(observableId) || !this.observables.get(observableId)?.running) {
        return
      }

      try {
        // Get stats for all queues in the observable
        const stats: Record<string, any> = {}

        for (const queueName of observable.queues) {
          const queue = this.queues.get(queueName)
          if (queue) {
            // Get job counts
            const counts = await queue.getJobCounts()

            // Get metrics if available
            const metrics = queue.getMetrics ? await queue.getMetrics() : {}

            stats[queueName] = {
              counts,
              metrics,
              timestamp: Date.now(),
            }
          }
        }

        // Store stats in Redis
        await this.redisClient.send('SET', [
          this.getObservableStatsKey(observableId),
          JSON.stringify(stats),
        ])

        // Set timer for next check
        this.timers.set(
          observableId,
          setTimeout(() => monitor(), observable.interval),
        )
      }
      catch (err) {
        this.logger.error(`Error monitoring queues for observable ${observableId}: ${(err as Error).message}`)

        // Retry after interval
        this.timers.set(
          observableId,
          setTimeout(() => monitor(), observable.interval),
        )
      }
    }

    // Start monitoring
    monitor()
  }

  /**
   * Get the latest stats for an observable
   */
  async getObservableStats(observableId: string): Promise<Record<string, any> | null> {
    const stats = await this.redisClient.get(this.getObservableStatsKey(observableId))

    if (!stats) {
      return null
    }

    return JSON.parse(stats)
  }

  /**
   * Close all monitoring timers
   */
  async closeAll(): Promise<void> {
    for (const [observableId, timer] of this.timers.entries()) {
      clearTimeout(timer)
      this.timers.delete(observableId)

      // Update observable status
      const observable = this.observables.get(observableId)
      if (observable) {
        observable.running = false
        this.observables.set(observableId, observable)

        // Update Redis
        await this.redisClient.send('HSET', [
          this.getObservableKey(observableId),
          'running',
          'false',
        ])
      }
    }

    this.logger.info('Closed all observables')
  }

  private getObservableKey(observableId: string): string {
    return `${this.prefix}:observable:${observableId}`
  }

  private getObservableStatsKey(observableId: string): string {
    return `${this.prefix}:observable:${observableId}:stats`
  }
}
