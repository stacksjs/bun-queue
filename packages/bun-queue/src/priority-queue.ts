import type { RedisClient } from 'bun'
import type { JobEvents } from './events'
import type { JobOptions, JobStatus, PriorityLevel, PriorityQueueOptions, QueueConfig } from './types'
import { Job } from './job'
import { createLogger } from './logger'
import { Queue } from './queue'
import { DEFAULT_PRIORITY_LEVEL, MAX_PRIORITY_LEVELS } from './types'
import { generateId } from './utils'

/**
 * PriorityQueue implements a queue with priority support
 * It maintains separate priority queues and processes higher priority jobs first
 */
export class PriorityQueue<T = any> {
  name: string
  prefix: string
  redisClient: RedisClient
  keyPrefix: string
  events: JobEvents

  private readonly baseQueue: Queue<T>
  private readonly priorityLevels: number
  private readonly defaultPriorityLevel: number
  private readonly dynamicReordering: boolean
  private readonly reorderInterval: number
  private reorderTimer: NodeJS.Timeout | null = null
  private readonly logger = createLogger('priority')
  private jobMoverTimer: NodeJS.Timeout | null = null

  constructor(
    name: string,
    priorityOptions: PriorityQueueOptions = {},
    queueOptions?: QueueConfig,
  ) {
    // Create the underlying queue
    this.baseQueue = new Queue<T>(name, queueOptions)

    // Copy basic properties from the underlying queue
    this.name = this.baseQueue.name
    this.prefix = this.baseQueue.prefix
    this.redisClient = this.baseQueue.redisClient
    this.keyPrefix = this.baseQueue.keyPrefix
    this.events = this.baseQueue.events

    // Set up priority queue options
    this.priorityLevels = priorityOptions.levels || MAX_PRIORITY_LEVELS
    this.defaultPriorityLevel = priorityOptions.defaultLevel || DEFAULT_PRIORITY_LEVEL
    this.dynamicReordering = priorityOptions.dynamicReordering || false
    this.reorderInterval = priorityOptions.reorderInterval || 5000 // Default: check every 5 seconds

    // Validate options
    if (this.priorityLevels <= 0) {
      throw new Error('Priority levels must be greater than 0')
    }

    if (this.defaultPriorityLevel < 0 || this.defaultPriorityLevel >= this.priorityLevels) {
      throw new Error(`Default priority level must be between 0 and ${this.priorityLevels - 1}`)
    }

    this.logger.info(`Priority queue created with ${this.priorityLevels} priority levels, default level: ${this.defaultPriorityLevel}`)

    // Start dynamic reordering if enabled
    if (this.dynamicReordering) {
      this.startDynamicReordering()
      this.logger.info('Dynamic reordering enabled')
    }
  }

  /**
   * Add a job to the priority queue
   */
  async add(data: T, options?: JobOptions): Promise<Job<T>> {
    // Get priority from options or use default
    const priority = options?.priority ?? this.defaultPriorityLevel

    // Validate priority
    if (priority < 0 || priority >= this.priorityLevels) {
      throw new Error(`Priority level must be between 0 and ${this.priorityLevels - 1}`)
    }

    // Use the parent add method but customize where the job goes
    const opts = {
      ...options,
      priority,
    }

    try {
      const jobId = opts.jobId || generateId()
      const timestamp = Date.now()

      // Store the job
      const jobKey = this.getJobKey(jobId)

      // Begin transaction
      await this.redisClient.send('MULTI', [])

      // Store the job data with priority
      await this.redisClient.send('HMSET', [
        jobKey,
        'id',
        jobId,
        'name',
        this.name,
        'data',
        JSON.stringify(data),
        'timestamp',
        timestamp.toString(),
        'delay',
        (opts.delay || 0).toString(),
        'opts',
        JSON.stringify(opts),
        'attemptsMade',
        '0',
        'progress',
        '0',
        'priority',
        priority.toString(),
      ])

      // Handle dependencies if any
      const dependencies = opts.dependsOn
        ? (Array.isArray(opts.dependsOn) ? opts.dependsOn : [opts.dependsOn])
        : undefined

      if (dependencies && dependencies.length > 0) {
        // Store the dependencies with the job
        await this.redisClient.send('HSET', [
          jobKey,
          'dependencies',
          JSON.stringify(dependencies),
        ])

        // Check if all dependencies exist
        const dependencyKeys = dependencies.map(depId => this.getJobKey(depId))
        let allDependenciesExist = true

        for (const depKey of dependencyKeys) {
          const exists = await this.redisClient.exists(depKey)
          if (!exists) {
            allDependenciesExist = false
            this.logger.warn(`Dependency job ${depKey} does not exist for job ${jobId}`)
            break
          }
        }

        // Store job ID in a dependency waiting set for each dependency
        for (const depId of dependencies) {
          const dependentKey = `${this.getJobKey(depId)}:dependents`
          await this.redisClient.send('SADD', [dependentKey, jobId])
        }

        // Add to dependency wait list if dependencies are not completed
        for (const depId of dependencies) {
          const depJob = await this.getJob(depId)
          if (depJob && !depJob.finishedOn) {
            await this.redisClient.send('SADD', [this.getKey('dependency-wait'), jobId])
            await this.redisClient.send('EXEC', [])

            const job = new Job<T>(this.baseQueue, jobId)
            await job.refresh()
            this.events.emitJobAdded(jobId, this.name)
            return job
          }
        }
      }

      // If we have a delay, add to delayed set
      if (opts.delay && opts.delay > 0) {
        const processAt = timestamp + opts.delay
        await this.redisClient.send('ZADD', [
          this.getKey('delayed'),
          processAt.toString(),
          jobId,
        ])

        this.events.emitJobDelayed(jobId, opts.delay)
      }
      else {
        // Add to the appropriate priority queue
        const priorityKey = this.getPriorityKey(priority)
        const pushCmd = opts.lifo ? 'RPUSH' : 'LPUSH'
        await this.redisClient.send(pushCmd, [priorityKey, jobId])
      }

      // Execute transaction
      await this.redisClient.send('EXEC', [])

      // Get the job with full details
      const job = new Job<T>(this.baseQueue, jobId)
      await job.refresh()

      this.events.emitJobAdded(jobId, this.name)
      return job
    }
    catch (error) {
      this.logger.error(`Error adding job to priority queue: ${(error as Error).message}`)
      throw error
    }
  }

  /**
   * Process jobs with a given handler function and concurrency
   */
  process(concurrency: number, handler: (job: Job<T>) => Promise<any>): void {
    // Create a custom worker that will process jobs by priority

    // First, start the job mover to ensure priority jobs are moved to the waiting queue
    this.startJobMover()

    // Then, process jobs using the base queue
    this.baseQueue.process(concurrency, handler)

    // Start dynamic reordering if enabled
    if (this.dynamicReordering && !this.reorderTimer) {
      this.startDynamicReordering()
    }
  }

  /**
   * Close the priority queue and cleanup
   */
  async close(): Promise<void> {
    // Stop reordering timer if running
    if (this.reorderTimer) {
      clearInterval(this.reorderTimer)
      this.reorderTimer = null
    }

    // Stop job mover timer if running
    if (this.jobMoverTimer) {
      clearInterval(this.jobMoverTimer)
      this.jobMoverTimer = null
    }

    // Close the underlying queue (which also stops the worker)
    await this.baseQueue.close()
  }

  /**
   * Get job by ID - delegated to underlying queue
   */
  async getJob(jobId: string): Promise<Job<T> | null> {
    return this.baseQueue.getJob(jobId)
  }

  /**
   * Forward other common queue methods to the underlying queue
   */
  async removeJob(jobId: string): Promise<void> {
    return this.baseQueue.removeJob(jobId)
  }

  async getJobs(status: JobStatus, start = 0, end = -1): Promise<Job<T>[]> {
    // Get jobs from the standard queue
    const standardJobs = await this.baseQueue.getJobs(status, start, end)

    // If we're not looking for waiting jobs, just return standard jobs
    if (status !== 'waiting') {
      return standardJobs
    }

    // For waiting status, we need to also check priority queues
    const priorityJobs: Job<T>[] = []

    for (let priority = this.priorityLevels - 1; priority >= 0; priority--) {
      const priorityKey = this.getPriorityKey(priority)
      const jobIds = await this.redisClient.send('LRANGE', [priorityKey, start.toString(), end.toString()])

      if (jobIds && jobIds.length > 0) {
        for (const jobId of jobIds) {
          const job = await this.getJob(jobId)
          if (job) {
            priorityJobs.push(job)
          }
        }
      }
    }

    // Combine all jobs
    return [...priorityJobs, ...standardJobs]
  }

  async getJobCounts(): Promise<Record<JobStatus, number>> {
    // Get job counts from the regular queue
    const baseJobCounts = await this.baseQueue.getJobCounts()

    // Add in counts for our priority queues
    const waitingJobs = baseJobCounts.waiting || 0
    let priorityJobs = 0

    for (let priority = 0; priority < this.priorityLevels; priority++) {
      const priorityKey = this.getPriorityKey(priority)
      const countResult = await this.redisClient.send('LLEN', [priorityKey])
      const count = typeof countResult === 'string' ? Number.parseInt(countResult, 10) : Number(countResult)
      priorityJobs += count
    }

    return {
      ...baseJobCounts,
      waiting: waitingJobs + priorityJobs,
    }
  }

  async empty(): Promise<void> {
    // Empty regular queue
    await this.baseQueue.empty()

    // Empty priority queues
    await this.redisClient.send('MULTI', [])

    for (let priority = 0; priority < this.priorityLevels; priority++) {
      const priorityKey = this.getPriorityKey(priority)
      await this.redisClient.send('DEL', [priorityKey])
    }

    await this.redisClient.send('EXEC', [])
  }

  /**
   * Move jobs from priority queues to the standard waiting queue
   * This allows the standard worker to process them in priority order
   */
  private async moveJobsToWaiting(): Promise<void> {
    // Check priority queues from highest to lowest
    for (let priority = this.priorityLevels - 1; priority >= 0; priority--) {
      const priorityKey = this.getPriorityKey(priority)

      // See if there are any jobs in this priority queue
      const lengthResult = await this.redisClient.send('LLEN', [priorityKey])
      const length = typeof lengthResult === 'string' ? Number.parseInt(lengthResult, 10) : Number(lengthResult)

      if (length && length > 0) {
        // Get all jobs from this priority level
        const jobIds = await this.redisClient.send('LRANGE', [priorityKey, '0', '-1'])

        if (jobIds && jobIds.length > 0) {
          // Move jobs to the front of the waiting queue in reverse order
          // (to maintain priority within the level)
          await this.redisClient.send('MULTI', [])

          // Remove from priority queue
          await this.redisClient.send('DEL', [priorityKey])

          // Add to waiting queue in reverse order to maintain priority
          for (let i = jobIds.length - 1; i >= 0; i--) {
            await this.redisClient.send('LPUSH', [this.getKey('waiting'), jobIds[i]])
          }

          await this.redisClient.send('EXEC', [])
        }
      }
    }
  }

  /**
   * Start a timer to periodically move jobs from priority queues to the waiting queue
   */
  private startJobMover(): void {
    // Move jobs immediately to start
    this.moveJobsToWaiting().catch(err =>
      this.logger.error(`Error moving priority jobs to waiting: ${(err as Error).message}`),
    )

    // Then set up interval to do it periodically (faster than the worker tick)
    this.jobMoverTimer = setInterval(() => {
      this.moveJobsToWaiting().catch(err =>
        this.logger.error(`Error moving priority jobs to waiting: ${(err as Error).message}`),
      )
    }, 25) // Faster than the standard worker tick (50ms)
  }

  /**
   * Dynamically reorder jobs based on priority
   */
  private async reorderJobs(): Promise<void> {
    try {
      this.logger.debug('Running dynamic job reordering')

      // Get all waiting jobs across all priority queues
      const allJobIds: string[] = []
      const jobPriorities: Record<string, number> = {}

      for (let priority = 0; priority < this.priorityLevels; priority++) {
        const priorityKey = this.getPriorityKey(priority)
        const jobIds = await this.redisClient.send('LRANGE', [priorityKey, '0', '-1'])

        if (jobIds && jobIds.length > 0) {
          for (const jobId of jobIds) {
            allJobIds.push(jobId)
            jobPriorities[jobId] = priority
          }
        }
      }

      // If no jobs to reorder, we're done
      if (allJobIds.length === 0) {
        return
      }

      // Begin transaction to reorder jobs
      await this.redisClient.send('MULTI', [])

      // Remove all jobs from their current priority queues
      for (let priority = 0; priority < this.priorityLevels; priority++) {
        const priorityKey = this.getPriorityKey(priority)
        await this.redisClient.send('DEL', [priorityKey])
      }

      // Get current job details and recompute priorities
      for (const jobId of allJobIds) {
        const job = await this.getJob(jobId)

        if (job) {
          // Get current priority from job options (it may have changed)
          const currentPriority = job.opts.priority ?? this.defaultPriorityLevel

          // If priority changed, update our tracking
          if (currentPriority !== jobPriorities[jobId]) {
            jobPriorities[jobId] = currentPriority
          }

          // Add job to the appropriate priority queue
          const priorityKey = this.getPriorityKey(jobPriorities[jobId])
          await this.redisClient.send('RPUSH', [priorityKey, jobId])
        }
      }

      // Execute transaction
      await this.redisClient.send('EXEC', [])

      this.logger.debug(`Reordered ${allJobIds.length} jobs across ${this.priorityLevels} priority levels`)
    }
    catch (error) {
      this.logger.error(`Error during job reordering: ${(error as Error).message}`)
    }
  }

  /**
   * Start the dynamic reordering timer
   */
  private startDynamicReordering(): void {
    if (this.reorderTimer) {
      clearInterval(this.reorderTimer)
    }

    this.reorderTimer = setInterval(() => this.reorderJobs(), this.reorderInterval)
  }

  /**
   * Get a Redis key scoped to this queue
   */
  getKey(name: string): string {
    return this.baseQueue.getKey(name)
  }

  /**
   * Get a Redis key for a job
   */
  getJobKey(jobId: string): string {
    return this.baseQueue.getJobKey(jobId)
  }

  /**
   * Get the Redis key for a specific priority level
   */
  private getPriorityKey(priority: PriorityLevel): string {
    return `${this.keyPrefix}:priority:${priority}`
  }
}
