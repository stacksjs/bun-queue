import type { RedisClient } from 'bun'
import { createLogger } from './logger'
import { generateId } from './utils'

export interface WorkCoordinatorOptions {
  /**
   * Key prefix for work coordination
   */
  keyPrefix?: string

  /**
   * The interval in ms to check for work
   */
  pollInterval?: number

  /**
   * The instance ID
   */
  instanceId?: string

  /**
   * The number of jobs to process concurrently per worker
   */
  jobsPerWorker?: number

  /**
   * Maximum number of workers (slots) to use per instance
   */
  maxWorkersPerInstance?: number
}

/**
 * Manages work distribution among multiple queue instances
 * to ensure fair sharing of jobs and prevent overloading any one instance
 */
export class WorkCoordinator {
  private readonly redisClient: RedisClient
  private readonly keyPrefix: string
  private readonly instanceId: string
  private readonly pollInterval: number
  private readonly jobsPerWorker: number
  private readonly maxWorkersPerInstance: number
  private readonly logger = createLogger('coordinator')
  private pollTimer: NodeJS.Timeout | null = null
  private workers: number = 0
  private running: boolean = false

  constructor(redisClient: RedisClient, options: WorkCoordinatorOptions = {}) {
    this.redisClient = redisClient
    this.keyPrefix = options.keyPrefix || 'bun-queue:coordinator'
    this.instanceId = options.instanceId || generateId()
    this.pollInterval = options.pollInterval || 5000 // 5 seconds default
    this.jobsPerWorker = options.jobsPerWorker || 10
    this.maxWorkersPerInstance = options.maxWorkersPerInstance || 10 // Default max 10 workers per instance

    this.logger.debug(`Work coordinator initialized for instance ${this.instanceId}`)
  }

  /**
   * Start the work coordinator
   */
  async start(): Promise<void> {
    if (this.running)
      return

    this.running = true
    this.logger.info(`Starting work coordinator for instance ${this.instanceId}`)

    // Register instance
    await this.registerInstance()

    // Start polling for work allocation
    this.startPolling()
  }

  /**
   * Stop the work coordinator
   */
  async stop(): Promise<void> {
    if (!this.running)
      return

    this.running = false
    this.logger.info(`Stopping work coordinator for instance ${this.instanceId}`)

    // Stop polling
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }

    // Unregister instance
    await this.unregisterInstance()
  }

  /**
   * Register this instance with the work coordinator
   */
  private async registerInstance(): Promise<void> {
    try {
      const instancesKey = `${this.keyPrefix}:instances`
      const instanceKey = `${this.keyPrefix}:instance:${this.instanceId}`

      // Set instance information with expiration
      const instanceInfo = JSON.stringify({
        id: this.instanceId,
        maxWorkers: this.maxWorkersPerInstance,
        jobsPerWorker: this.jobsPerWorker,
        startedAt: Date.now(),
        lastHeartbeat: Date.now(),
        workersAssigned: 0,
      })

      await this.redisClient.send('MULTI', [])
      // Add to instances set
      await this.redisClient.send('SADD', [instancesKey, this.instanceId])
      // Set instance details
      await this.redisClient.send('SET', [
        instanceKey,
        instanceInfo,
        'PX',
        // Set expiry to 3x poll interval
        (this.pollInterval * 3).toString(),
      ])
      await this.redisClient.send('EXEC', [])

      this.logger.debug(`Registered instance ${this.instanceId}`)
    }
    catch (err) {
      this.logger.error(`Error registering instance: ${(err as Error).message}`)
    }
  }

  /**
   * Unregister this instance
   */
  private async unregisterInstance(): Promise<void> {
    try {
      const instancesKey = `${this.keyPrefix}:instances`
      const instanceKey = `${this.keyPrefix}:instance:${this.instanceId}`
      const workersKey = `${this.keyPrefix}:workers:${this.instanceId}`

      await this.redisClient.send('MULTI', [])
      // Remove from instances set
      await this.redisClient.send('SREM', [instancesKey, this.instanceId])
      // Remove instance details
      await this.redisClient.send('DEL', [instanceKey, workersKey])
      await this.redisClient.send('EXEC', [])

      this.logger.debug(`Unregistered instance ${this.instanceId}`)
    }
    catch (err) {
      this.logger.error(`Error unregistering instance: ${(err as Error).message}`)
    }
  }

  /**
   * Start polling for work
   */
  private startPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
    }

    this.pollTimer = setInterval(async () => {
      try {
        // Send heartbeat
        await this.sendHeartbeat()

        // Coordinate work
        await this.coordinateWork()
      }
      catch (err) {
        this.logger.error(`Error in work coordination: ${(err as Error).message}`)
      }
    }, this.pollInterval)
  }

  /**
   * Send a heartbeat to keep instance registration alive
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const instanceKey = `${this.keyPrefix}:instance:${this.instanceId}`

      // Get current instance info
      const instanceInfoJson = await this.redisClient.get(instanceKey)
      if (!instanceInfoJson) {
        // Re-register if our info is gone
        await this.registerInstance()
        return
      }

      // Update the heartbeat time
      const instanceInfo = JSON.parse(instanceInfoJson)
      instanceInfo.lastHeartbeat = Date.now()

      // Save updated info
      await this.redisClient.send('SET', [
        instanceKey,
        JSON.stringify(instanceInfo),
        'PX',
        // Set expiry to 3x poll interval
        (this.pollInterval * 3).toString(),
      ])
    }
    catch (err) {
      this.logger.error(`Error sending heartbeat: ${(err as Error).message}`)
    }
  }

  /**
   * Coordinate work assignments between instances
   */
  private async coordinateWork(): Promise<void> {
    try {
      // Only do coordination if we're the leader
      const instancesKey = `${this.keyPrefix}:instances`

      // Get all registered instances
      const instances = await this.redisClient.send('SMEMBERS', [instancesKey]) as string[]

      if (!instances || instances.length === 0) {
        this.logger.warn(`No instances registered for coordination`)
        return
      }

      // Get info for all instances
      const instanceInfo: Record<string, any> = {}
      const activeInstances: string[] = []
      let totalWorkers = 0
      let totalMaxWorkers = 0

      for (const instanceId of instances) {
        const instanceKey = `${this.keyPrefix}:instance:${instanceId}`
        const infoJson = await this.redisClient.get(instanceKey)

        if (!infoJson) {
          continue // Instance data missing
        }

        const info = JSON.parse(infoJson)

        // Check if instance is still active (heartbeat not too old)
        const lastHeartbeat = info.lastHeartbeat || 0
        if (Date.now() - lastHeartbeat > this.pollInterval * 3) {
          // Instance considered dead, remove it
          await this.redisClient.send('SREM', [instancesKey, instanceId])
          await this.redisClient.send('DEL', [instanceKey])
          continue
        }

        instanceInfo[instanceId] = info
        activeInstances.push(instanceId)
        totalWorkers += info.workersAssigned || 0
        totalMaxWorkers += info.maxWorkers || this.maxWorkersPerInstance
      }

      if (activeInstances.length === 0) {
        this.logger.warn(`No active instances for coordination`)
        return
      }

      // Calculate target workers per instance for fair distribution
      // This is the core of the work distribution algorithm
      const workerDistribution = this.calculateWorkerDistribution(
        instanceInfo,
        activeInstances,
        totalWorkers,
        totalMaxWorkers,
      )

      // Update our worker count based on the calculation
      this.workers = workerDistribution[this.instanceId] || 0

      // Update our instance info
      const ourInstanceKey = `${this.keyPrefix}:instance:${this.instanceId}`
      const ourInfo = instanceInfo[this.instanceId]

      if (ourInfo) {
        ourInfo.workersAssigned = this.workers
        await this.redisClient.send('SET', [
          ourInstanceKey,
          JSON.stringify(ourInfo),
          'PX',
          (this.pollInterval * 3).toString(),
        ])
      }

      this.logger.debug(`Instance ${this.instanceId} assigned ${this.workers} workers out of ${totalWorkers} total`)
    }
    catch (err) {
      this.logger.error(`Error coordinating work: ${(err as Error).message}`)
    }
  }

  /**
   * Calculate a fair distribution of workers among instances
   */
  private calculateWorkerDistribution(
    instanceInfo: Record<string, any>,
    activeInstances: string[],
    totalWorkers: number,
    totalMaxWorkers: number,
  ): Record<string, number> {
    const distribution: Record<string, number> = {}

    // If no instances or workers, return empty distribution
    if (activeInstances.length === 0 || totalWorkers === 0) {
      return distribution
    }

    // Ensure we don't exceed total capacity
    totalWorkers = Math.min(totalWorkers, totalMaxWorkers)

    // First pass: assign workers proportionally to max capacity
    let remainingWorkers = totalWorkers
    let remainingCapacity = totalMaxWorkers

    for (const instanceId of activeInstances) {
      const info = instanceInfo[instanceId]
      const maxWorkers = info.maxWorkers || this.maxWorkersPerInstance

      // Calculate proportional share of workers
      let workerShare = Math.floor((maxWorkers / remainingCapacity) * remainingWorkers)

      // Cap at max workers for this instance
      workerShare = Math.min(workerShare, maxWorkers)

      distribution[instanceId] = workerShare
      remainingWorkers -= workerShare
      remainingCapacity -= maxWorkers
    }

    // Second pass: distribute any remaining workers fairly
    if (remainingWorkers > 0) {
      // Sort instances by current allocation ratio
      const instancesByRoom = activeInstances
        .filter((id) => {
          const info = instanceInfo[id]
          return (distribution[id] || 0) < (info.maxWorkers || this.maxWorkersPerInstance)
        })
        .sort((a, b) => {
          const infoA = instanceInfo[a]
          const infoB = instanceInfo[b]
          const ratioA = (distribution[a] || 0) / (infoA.maxWorkers || this.maxWorkersPerInstance)
          const ratioB = (distribution[b] || 0) / (infoB.maxWorkers || this.maxWorkersPerInstance)
          return ratioA - ratioB // Sort by lowest allocation ratio first
        })

      // Distribute remaining workers
      for (let i = 0; i < instancesByRoom.length && remainingWorkers > 0; i++) {
        const instanceId = instancesByRoom[i]
        const info = instanceInfo[instanceId]
        const maxWorkers = info.maxWorkers || this.maxWorkersPerInstance

        if (distribution[instanceId] < maxWorkers) {
          distribution[instanceId]++
          remainingWorkers--
        }

        // If we still have workers, go back to the beginning
        if (i === instancesByRoom.length - 1 && remainingWorkers > 0) {
          i = -1 // Will become 0 after i++
        }
      }
    }

    return distribution
  }

  /**
   * Get the number of workers currently assigned to this instance
   */
  getWorkerCount(): number {
    return this.workers
  }

  /**
   * Get all instances and their worker assignments
   */
  async getInstanceStatistics(): Promise<Record<string, any>> {
    try {
      const instancesKey = `${this.keyPrefix}:instances`
      const instances = await this.redisClient.send('SMEMBERS', [instancesKey]) as string[]

      if (!instances || instances.length === 0) {
        return {}
      }

      const stats: Record<string, any> = {}

      for (const instanceId of instances) {
        const instanceKey = `${this.keyPrefix}:instance:${instanceId}`
        const infoJson = await this.redisClient.get(instanceKey)

        if (infoJson) {
          try {
            const info = JSON.parse(infoJson)
            stats[instanceId] = info
          }
          catch (err) {
            this.logger.error(`Error parsing instance info for ${instanceId}: ${(err as Error).message}`)
          }
        }
      }

      return stats
    }
    catch (err) {
      this.logger.error(`Error getting instance statistics: ${(err as Error).message}`)
      return {}
    }
  }
}
