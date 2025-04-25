import type { RedisClient } from 'bun'
import type { Queue } from './queue'
import type { Group, GroupOptions, Job } from './types'
import type { Worker } from './worker'
import { createLogger } from './logger'

export class QueueGroup<T = any> {
  private readonly redisClient: RedisClient
  private readonly prefix: string
  private readonly queues: Map<string, Queue<T>> = new Map()
  private workers: Map<string, Worker<T>> = new Map()
  private readonly logger = createLogger()

  constructor(prefix: string, redisClient: RedisClient) {
    this.prefix = prefix
    this.redisClient = redisClient
  }

  /**
   * Add a queue to the group
   */
  async addQueue(queue: Queue<T>, options?: GroupOptions): Promise<void> {
    const queueName = queue.name

    if (this.queues.has(queueName)) {
      this.logger.warn(`Queue ${queueName} already exists in group`)
      return
    }

    // Default options
    const opts: Group = {
      name: options?.name || queueName,
      limit: options?.limit || 0,
      maxConcurrency: options?.maxConcurrency || 1,
      queues: [queueName],
    }

    // Add queue to Redis group
    await this.redisClient.send('SADD', [
      this.getGroupKey(opts.name),
      queueName,
    ])

    // Store group metadata
    await this.redisClient.send('HMSET', [
      this.getGroupMetaKey(opts.name),
      'name',
      opts.name,
      'limit',
      opts.limit.toString(),
      'maxConcurrency',
      opts.maxConcurrency.toString(),
    ])

    // Add to our local map
    this.queues.set(queueName, queue)

    // Emit group created event
    queue.events.emit('groupCreated', opts.name)

    this.logger.info(`Added queue ${queueName} to group ${opts.name}`)
  }

  /**
   * Remove a queue from the group
   */
  async removeQueue(queueName: string, groupName?: string): Promise<void> {
    const queue = this.queues.get(queueName)

    if (!queue) {
      this.logger.warn(`Queue ${queueName} not found in group`)
      return
    }

    // If group name is provided, only remove from that group
    if (groupName) {
      await this.redisClient.send('SREM', [
        this.getGroupKey(groupName),
        queueName,
      ])

      // Check if group is empty
      const members = await this.redisClient.send('SMEMBERS', [this.getGroupKey(groupName)])

      if (!members || members.length === 0) {
        // Remove group metadata
        await this.redisClient.send('DEL', [this.getGroupMetaKey(groupName)])

        // Emit group removed event
        queue.events.emit('groupRemoved', groupName)
      }
    }
    else {
      // Remove from all groups
      const groups = await this.getAllGroups()

      for (const group of groups) {
        const members = await this.redisClient.send('SMEMBERS', [this.getGroupKey(group.name)])

        if (members && members.includes(queueName)) {
          await this.redisClient.send('SREM', [
            this.getGroupKey(group.name),
            queueName,
          ])

          // Check if group is empty
          const updatedMembers = await this.redisClient.send('SMEMBERS', [this.getGroupKey(group.name)])

          if (!updatedMembers || updatedMembers.length === 0) {
            // Remove group metadata
            await this.redisClient.send('DEL', [this.getGroupMetaKey(group.name)])

            // Emit group removed event
            queue.events.emit('groupRemoved', group.name)
          }
        }
      }
    }

    // Remove from our local map
    this.queues.delete(queueName)

    this.logger.info(`Removed queue ${queueName} from group${groupName ? ` ${groupName}` : 's'}`)
  }

  /**
   * Get all groups
   */
  async getAllGroups(): Promise<Group[]> {
    const groups: Group[] = []
    const keys = await this.redisClient.send('KEYS', [`${this.prefix}:group:*:meta`])

    if (!keys || keys.length === 0) {
      return groups
    }

    for (const key of keys) {
      const groupName = key.split(':')[2]
      const group = await this.getGroup(groupName)

      if (group) {
        groups.push(group)
      }
    }

    return groups
  }

  /**
   * Get a group by name
   */
  async getGroup(groupName: string): Promise<Group | null> {
    const exists = await this.redisClient.exists(this.getGroupMetaKey(groupName))

    if (!exists) {
      return null
    }

    const meta = await this.redisClient.send('HGETALL', [this.getGroupMetaKey(groupName)])
    const members = await this.redisClient.send('SMEMBERS', [this.getGroupKey(groupName)])

    if (!meta || !members) {
      return null
    }

    return {
      name: meta.name || groupName,
      limit: Number.parseInt(meta.limit || '0'),
      maxConcurrency: Number.parseInt(meta.maxConcurrency || '1'),
      queues: members,
    }
  }

  /**
   * Process jobs from all queues in a group
   */
  async processGroup<R = any>(groupName: string, handler: (job: Job<T>) => Promise<R>): Promise<void> {
    const group = await this.getGroup(groupName)

    if (!group) {
      throw new Error(`Group ${groupName} not found`)
    }

    // Stop any existing workers for this group
    if (this.workers.has(groupName)) {
      const worker = this.workers.get(groupName)
      if (worker) {
        await worker.stop()
      }
      this.workers.delete(groupName)
    }

    // Get all queues in the group
    const queues: Queue<T>[] = []

    for (const queueName of group.queues) {
      const queue = this.queues.get(queueName)

      if (queue) {
        queues.push(queue)
      }
    }

    if (queues.length === 0) {
      this.logger.warn(`No queues found in group ${groupName}`)
      return
    }

    // Create a worker for each queue
    for (const queue of queues) {
      // Start processing the queue
      queue.process(group.maxConcurrency, handler)

      this.logger.info(`Started processing queue ${queue.name} in group ${groupName} with concurrency ${group.maxConcurrency}`)
    }
  }

  /**
   * Add a job to all queues in a group
   */
  async addJobToGroup<R = any>(groupName: string, data: T): Promise<Job<T>[]> {
    const group = await this.getGroup(groupName)

    if (!group) {
      throw new Error(`Group ${groupName} not found`)
    }

    const jobs: Job<T>[] = []

    // Check if we've hit the limit
    if (group.limit > 0) {
      let totalJobs = 0

      for (const queueName of group.queues) {
        const queue = this.queues.get(queueName)

        if (queue) {
          const counts = await queue.getJobCounts()
          totalJobs += Object.values(counts).reduce((sum, count) => sum + count, 0)
        }
      }

      if (totalJobs >= group.limit) {
        this.logger.warn(`Group ${groupName} has reached its limit of ${group.limit} jobs`)
        return jobs
      }
    }

    // Add job to each queue in the group
    for (const queueName of group.queues) {
      const queue = this.queues.get(queueName)

      if (queue) {
        const job = await queue.add(data)
        jobs.push(job)

        this.logger.debug(`Added job ${job.id} to queue ${queueName} in group ${groupName}`)
      }
    }

    return jobs
  }

  /**
   * Close all workers in a group
   */
  async closeGroup(groupName: string): Promise<void> {
    const worker = this.workers.get(groupName)

    if (worker) {
      await worker.stop()
      this.workers.delete(groupName)

      this.logger.info(`Closed worker for group ${groupName}`)
    }
  }

  /**
   * Close all workers in all groups
   */
  async closeAll(): Promise<void> {
    for (const [groupName, worker] of this.workers.entries()) {
      await worker.stop()
      this.workers.delete(groupName)

      this.logger.info(`Closed worker for group ${groupName}`)
    }
  }

  private getGroupKey(groupName: string): string {
    return `${this.prefix}:group:${groupName}`
  }

  private getGroupMetaKey(groupName: string): string {
    return `${this.prefix}:group:${groupName}:meta`
  }
}
