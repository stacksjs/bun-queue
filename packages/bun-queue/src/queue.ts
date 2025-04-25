import type { RedisClient } from 'bun'
import type { CronJobOptions } from './cron-scheduler'
import type { RateLimitResult } from './rate-limiter'
import type { DeadLetterQueueOptions, JobOptions, JobStatus, QueueConfig } from './types'
import { CleanupService } from './cleanup'
import { scriptLoader } from './commands'
import { config } from './config'
import { CronScheduler } from './cron-scheduler'
import { DeadLetterQueue } from './dead-letter-queue'
import { DistributedLock } from './distributed-lock'
import { JobEvents } from './events'
import { Job } from './job'
import { LeaderElection } from './leader-election'
import { createLogger } from './logger'
import { Metrics } from './metrics'
import { RateLimiter } from './rate-limiter'
import { StalledJobChecker } from './stalled-checker'
import { generateId, getRedisClient, mergeOptions } from './utils'
import { WorkCoordinator } from './work-coordinator'
import { Worker } from './worker'

export class Queue<T = any> {
  name: string
  prefix: string
  redisClient: RedisClient
  keyPrefix: string
  events: JobEvents
  private worker: Worker<T> | null = null
  private metrics: Metrics | null = null
  private cleanupService: CleanupService | null = null
  private stalledChecker: StalledJobChecker | null = null
  private readonly logger = createLogger()
  private limiter: RateLimiter | null = null
  private defaultJobOptions: JobOptions | undefined
  private lock: DistributedLock | null = null
  private cronScheduler: CronScheduler | null = null
  private deadLetterQueue: DeadLetterQueue<T> | null = null
  private defaultDeadLetterOptions: DeadLetterQueueOptions | undefined
  private leaderElection: LeaderElection | null = null
  private workCoordinator: WorkCoordinator | null = null
  private instanceId: string
  private horizontalScalingEnabled: boolean = false

  constructor(name: string, options?: QueueConfig) {
    this.name = name
    this.prefix = options?.prefix || config.prefix || 'queue'
    this.redisClient = getRedisClient(options)
    this.keyPrefix = `${this.prefix}:${this.name}`
    this.events = new JobEvents(name)
    this.defaultJobOptions = options?.defaultJobOptions
    this.instanceId = options?.horizontalScaling?.instanceId || generateId()

    // Set logger level if specified
    if (options?.logLevel) {
      this.logger.setLevel(options.logLevel)
    }

    // Initialize metrics if enabled
    if (options?.metrics?.enabled || config.metrics?.enabled) {
      this.metrics = new Metrics(this)
      this.logger.debug(`Metrics enabled for queue ${name}`)
    }

    // Initialize stalled job checker
    const stalledJobCheckInterval = options?.stalledJobCheckInterval || config.stalledJobCheckInterval
    const maxStalledJobRetries = options?.maxStalledJobRetries || config.maxStalledJobRetries

    if (stalledJobCheckInterval) {
      this.stalledChecker = new StalledJobChecker(this, stalledJobCheckInterval, maxStalledJobRetries)
      this.stalledChecker.start()
      this.logger.debug(`Stalled job checker started for queue ${name}`)
    }

    // Initialize rate limiter if provided
    if (options?.limiter) {
      this.limiter = new RateLimiter(this, options.limiter)
      this.logger.debug(`Rate limiter configured for queue ${name}`)
    }

    // Initialize distributed lock for job processing
    if (options?.distributedLock !== false) {
      this.lock = new DistributedLock(this.redisClient, `${this.prefix}:lock`)
      this.logger.debug(`Distributed lock system initialized for queue ${name}`)
    }

    // Initialize cron scheduler
    this.cronScheduler = new CronScheduler(this)
    this.logger.debug(`Cron scheduler initialized for queue ${name}`)

    // Initialize scripts
    this.init()

    this.defaultDeadLetterOptions = options?.defaultDeadLetterOptions

    // Initialize dead letter queue if enabled by default
    if (options?.defaultDeadLetterOptions?.enabled) {
      this.deadLetterQueue = new DeadLetterQueue<T>(this, options.defaultDeadLetterOptions)
      this.logger.debug(`Dead letter queue initialized for queue ${name}`)
    }

    // Initialize horizontal scaling if enabled
    if (options?.horizontalScaling?.enabled) {
      this.horizontalScalingEnabled = true
      this.initializeHorizontalScaling(options)
    }
  }

  /**
   * Initialize horizontal scaling components
   */
  private initializeHorizontalScaling(options: QueueConfig): void {
    const hsOptions = options.horizontalScaling || {}

    // Initialize leader election
    this.leaderElection = new LeaderElection(this.redisClient, {
      keyPrefix: `${this.prefix}:${this.name}:leader`,
      instanceId: this.instanceId,
      heartbeatInterval: hsOptions.leaderElection?.heartbeatInterval,
      leaderTimeout: hsOptions.leaderElection?.leaderTimeout,
      onBecomeLeader: () => this.handleBecomeLeader(),
      onLeadershipLost: () => this.handleLeadershipLost(),
      onLeaderChanged: leaderId => this.handleLeaderChanged(leaderId),
    })

    // Initialize work coordinator
    this.workCoordinator = new WorkCoordinator(this.redisClient, {
      keyPrefix: hsOptions.workCoordination?.keyPrefix || `${this.prefix}:${this.name}:coordinator`,
      instanceId: this.instanceId,
      pollInterval: hsOptions.workCoordination?.pollInterval,
      jobsPerWorker: hsOptions.jobsPerWorker || 10,
      maxWorkersPerInstance: hsOptions.maxWorkersPerInstance || 10,
    })

    this.logger.info(`Horizontal scaling initialized for queue ${this.name} with instance ID ${this.instanceId}`)
  }

  /**
   * Handler for when this instance becomes the leader
   */
  private handleBecomeLeader(): void {
    this.logger.info(`Instance ${this.instanceId} became the leader for queue ${this.name}`)
    // The leader typically handles distributed tasks like:
    // - Moving delayed jobs to ready queue
    // - Cleaning up stale jobs
    // - Any other cluster-wide administrative tasks
  }

  /**
   * Handler for when this instance loses leadership
   */
  private handleLeadershipLost(): void {
    this.logger.info(`Instance ${this.instanceId} lost leadership for queue ${this.name}`)
  }

  /**
   * Handler for when the leader changes
   */
  private handleLeaderChanged(leaderId: string): void {
    this.logger.info(`Leader changed to ${leaderId} for queue ${this.name}`)
  }

  /**
   * Initialize the queue by loading scripts
   */
  private async init(): Promise<void> {
    try {
      await scriptLoader.load(this.redisClient, 'src/commands')
      this.events.emitReady()
      this.logger.info(`Queue ${this.name} initialized successfully`)
    }
    catch (err) {
      this.logger.error(`Error initializing queue ${this.name}: ${(err as Error).message}`)
      this.events.emitError(err as Error)
    }
  }

  /**
   * Add a job to the queue with rate limiting support
   */
  async add(data: T, options?: JobOptions): Promise<Job<T>> {
    try {
      // Check rate limit if configured
      if (this.limiter) {
        // If we have keyPrefix in the limiter, check rate limit based on data
        const limiterResult = await this.limiter.check(data)

        if (limiterResult.limited) {
          this.logger.warn(`Rate limit exceeded, retrying in ${limiterResult.resetIn}ms`)

          // If rate limited, add to delayed queue with the reset time
          const opts = {
            ...this.defaultJobOptions,
            ...options,
            delay: limiterResult.resetIn,
          }

          return this.add(data, opts)
        }
      }

      const opts = mergeOptions(options)
      const jobId = opts.jobId || generateId()
      const timestamp = Date.now()

      // Store the job
      const jobKey = this.getJobKey(jobId)

      // Check if we have dependencies
      const dependencies = opts.dependsOn
        ? (Array.isArray(opts.dependsOn) ? opts.dependsOn : [opts.dependsOn])
        : undefined

      // Create a multi command
      await this.redisClient.send('MULTI', [])

      // Store the job data
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
      ])

      // If we have dependencies, store them and create a dependency list
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

        if (!allDependenciesExist) {
          // If dependencies don't exist, add the job but don't process it yet
          this.logger.warn(`Job ${jobId} has dependencies that don't exist, adding to waiting list anyway`)
        }

        // Store job ID in a dependency waiting set for each dependency
        for (const depId of dependencies) {
          const dependentKey = `${this.getJobKey(depId)}:dependents`
          await this.redisClient.send('SADD', [dependentKey, jobId])
        }

        // Add to a special dependencies list if any dependency is not completed
        for (const depId of dependencies) {
          const depJob = await this.getJob(depId)
          if (depJob && !depJob.finishedOn) {
            // At least one dependency is not finished, add to dependency wait list
            await this.redisClient.send('SADD', [this.getKey('dependency-wait'), jobId])
            // Don't add to the waiting/delayed list yet
            await this.redisClient.send('EXEC', [])

            const job = new Job<T>(this, jobId)
            await job.refresh()

            // Emit events
            this.events.emitJobAdded(jobId, this.name)
            if (this.metrics) {
              this.metrics.trackJobAdded()
            }

            return job
          }
        }
      }

      // If we get here, either we have no dependencies or all dependencies are already completed
      if (opts.delay && opts.delay > 0) {
        // Add to delayed set
        const processAt = timestamp + opts.delay
        await this.redisClient.send('ZADD', [
          this.getKey('delayed'),
          processAt.toString(),
          jobId,
        ])

        // Emit delayed event
        this.events.emitJobDelayed(jobId, opts.delay)
      }
      else {
        // Add to waiting list
        const pushCmd = opts.lifo ? 'RPUSH' : 'LPUSH'
        await this.redisClient.send(pushCmd, [this.getKey('waiting'), jobId])
      }

      // Execute the multi command
      await this.redisClient.send('EXEC', [])

      const job = new Job<T>(this, jobId)
      await job.refresh()

      // Emit events
      this.events.emitJobAdded(jobId, this.name)
      if (this.metrics) {
        this.metrics.trackJobAdded()
      }

      return job
    }
    catch (err) {
      this.logger.error(`Error adding job to queue ${this.name}: ${(err as Error).message}`)
      this.events.emitError(err as Error)
      throw err
    }
  }

  /**
   * Process jobs with a handler function
   */
  process(concurrency: number, handler: (job: Job<T>) => Promise<any>): void {
    if (this.horizontalScalingEnabled && this.workCoordinator) {
      // In horizontal scaling mode, we need to start the leader election and work coordinator
      this.logger.info(`Starting horizontal scaling for queue ${this.name}`)
      this.startHorizontalScaling(concurrency, handler)
    }
    else {
      // Traditional single instance mode
      this.startWorker(concurrency, handler)
    }
  }

  /**
   * Start processing in horizontal scaling mode
   */
  private async startHorizontalScaling(concurrency: number, handler: (job: Job<T>) => Promise<any>): Promise<void> {
    if (!this.leaderElection || !this.workCoordinator) {
      throw new Error('Horizontal scaling components not initialized')
    }

    // Start leader election
    await this.leaderElection.start()

    // Start work coordinator
    await this.workCoordinator.start()

    // Start worker with the initial concurrency, this will be dynamically adjusted
    this.startWorker(concurrency, handler)

    // Set up a periodic check to adjust worker concurrency based on the coordinator
    const adjustWorkerInterval = setInterval(() => {
      if (!this.workCoordinator || !this.worker)
        return

      const targetWorkers = this.workCoordinator.getWorkerCount()
      if (targetWorkers !== this.worker.concurrency) {
        this.worker.adjustConcurrency(targetWorkers)
        this.logger.info(`Adjusted worker concurrency to ${targetWorkers} for queue ${this.name}`)
      }
    }, 5000) // Check every 5 seconds

    // Store the interval reference for cleanup
    this._horizontalScalingInterval = adjustWorkerInterval
  }

  /**
   * Start a worker in traditional mode
   */
  private startWorker(concurrency: number, handler: (job: Job<T>) => Promise<any>): void {
    this.worker = new Worker<T>(this, concurrency, handler)
    this.worker.start()
    this.logger.info(`Started worker for queue ${this.name} with concurrency ${concurrency}`)

    // Initialize cleanup service if not already done
    if (!this.cleanupService) {
      this.cleanupService = new CleanupService(this)
      this.cleanupService.start()
      this.logger.debug(`Cleanup service started for queue ${this.name}`)
    }
  }

  // Store interval for horizontal scaling
  private _horizontalScalingInterval: NodeJS.Timeout | null = null

  /**
   * Stop processing jobs
   */
  async close(): Promise<void> {
    try {
      // Stop horizontal scaling components if enabled
      if (this.horizontalScalingEnabled) {
        if (this._horizontalScalingInterval) {
          clearInterval(this._horizontalScalingInterval)
          this._horizontalScalingInterval = null
        }

        if (this.leaderElection) {
          await this.leaderElection.stop()
        }

        if (this.workCoordinator) {
          await this.workCoordinator.stop()
        }
      }

      if (this.worker) {
        await this.worker.stop()
        this.worker = null
      }

      if (this.cleanupService) {
        this.cleanupService.stop()
        this.cleanupService = null
      }

      if (this.stalledChecker) {
        this.stalledChecker.stop()
        this.stalledChecker = null
      }

      this.redisClient.close()
      this.logger.info(`Queue ${this.name} closed`)
    }
    catch (err) {
      this.logger.error(`Error closing queue ${this.name}: ${(err as Error).message}`)
    }
  }

  /**
   * Get the instance ID for this queue
   */
  getInstanceId(): string {
    return this.instanceId
  }

  /**
   * Get information about all instances in the horizontal scaling cluster
   */
  async getClusterInfo(): Promise<Record<string, any> | null> {
    if (!this.horizontalScalingEnabled || !this.workCoordinator) {
      return null
    }

    try {
      const instances = await this.workCoordinator.getInstanceStatistics()
      return instances
    }
    catch (err) {
      this.logger.error(`Error getting cluster info: ${(err as Error).message}`)
      return null
    }
  }

  /**
   * Check if this instance is the leader in the cluster
   */
  isLeader(): boolean {
    if (!this.horizontalScalingEnabled || !this.leaderElection) {
      return true // In non-clustered mode, the instance is always the "leader"
    }

    return this.leaderElection.isCurrentLeader()
  }

  /**
   * Get the ID of the current leader
   */
  async getLeaderId(): Promise<string | null> {
    if (!this.horizontalScalingEnabled || !this.leaderElection) {
      return this.instanceId // In non-clustered mode, the instance is always the "leader"
    }

    return this.leaderElection.getCurrentLeader()
  }

  /**
   * Get a job by id
   */
  async getJob(jobId: string): Promise<Job<T> | null> {
    try {
      const jobKey = this.getJobKey(jobId)
      const exists = await this.redisClient.exists(jobKey)

      if (!exists) {
        return null
      }

      const job = new Job<T>(this, jobId)
      await job.refresh()
      return job
    }
    catch (err) {
      this.logger.error(`Error getting job ${jobId} from queue ${this.name}: ${(err as Error).message}`)
      return null
    }
  }

  /**
   * Pause the queue
   */
  async pause(): Promise<void> {
    await this.redisClient.set(this.getKey('paused'), '1')
    this.logger.info(`Queue ${this.name} paused`)
  }

  /**
   * Resume the queue
   */
  async resume(): Promise<void> {
    await this.redisClient.del(this.getKey('paused'))
    this.logger.info(`Queue ${this.name} resumed`)
  }

  /**
   * Remove a job from the queue
   */
  async removeJob(jobId: string): Promise<void> {
    try {
      const jobKey = this.getJobKey(jobId)

      // Get job data first to check for dependencies
      const job = await this.getJob(jobId)
      if (!job) {
        return
      }

      // Remove from all possible lists
      const statusLists = ['active', 'waiting', 'completed', 'failed', 'dependency-wait']
      for (const list of statusLists) {
        await this.redisClient.send('LREM', [this.getKey(list), '0', jobId])
        // Also remove from sets
        await this.redisClient.send('SREM', [this.getKey(list), jobId])
      }

      // Remove from delayed set
      await this.redisClient.send('ZREM', [this.getKey('delayed'), jobId])

      // Remove dependent jobs link
      const dependentKey = `${jobKey}:dependents`
      const dependents = await this.redisClient.send('SMEMBERS', [dependentKey])

      if (dependents && dependents.length > 0) {
        // Process dependent jobs, they might be ready to move to waiting now
        for (const depJobId of dependents) {
          // Check if all dependencies of this dependent job are completed
          const depJob = await this.getJob(depJobId)
          if (depJob && depJob.dependencies) {
            // Check if all remaining dependencies are completed
            let allDependenciesCompleted = true
            for (const dependency of depJob.dependencies) {
              if (dependency !== jobId) { // Skip the one we're removing
                const depJob = await this.getJob(dependency)
                if (depJob && !depJob.finishedOn) {
                  allDependenciesCompleted = false
                  break
                }
              }
            }

            if (allDependenciesCompleted) {
              // All dependencies are now completed, move to waiting
              await this.redisClient.send('SREM', [this.getKey('dependency-wait'), depJobId])
              await this.redisClient.send('LPUSH', [this.getKey('waiting'), depJobId])
              this.logger.debug(`Job ${depJobId} dependencies met, moved to waiting`)
            }
          }
        }
      }

      // Remove the job hash and the dependent key
      await this.redisClient.send('DEL', [jobKey, dependentKey])

      // Emit event
      this.events.emitJobRemoved(jobId)
      this.logger.debug(`Job ${jobId} removed from queue ${this.name}`)
    }
    catch (err) {
      this.logger.error(`Error removing job ${jobId} from queue ${this.name}: ${(err as Error).message}`)
    }
  }

  /**
   * Get metrics data
   */
  async getMetrics(): Promise<any> {
    if (!this.metrics) {
      return null
    }

    return await this.metrics.getMetrics()
  }

  /**
   * Get jobs by status
   */
  async getJobs(status: JobStatus, start = 0, end = -1): Promise<Job<T>[]> {
    try {
      let jobIds: string[] = []

      if (status === 'delayed') {
        const jobs = await this.redisClient.send('ZRANGE', [
          this.getKey(status),
          start.toString(),
          end.toString(),
        ])
        jobIds = jobs as string[]
      }
      else {
        const jobs = await this.redisClient.send('LRANGE', [
          this.getKey(status),
          start.toString(),
          end.toString(),
        ])
        jobIds = jobs as string[]
      }

      const result: Job<T>[] = []

      for (const jobId of jobIds) {
        const job = await this.getJob(jobId)
        if (job) {
          result.push(job)
        }
      }

      return result
    }
    catch (err) {
      this.logger.error(`Error getting jobs with status ${status} from queue ${this.name}: ${(err as Error).message}`)
      return []
    }
  }

  /**
   * Get job counts
   */
  async getJobCounts(): Promise<Record<JobStatus, number>> {
    try {
      const statuses: JobStatus[] = ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused']
      const counts: Record<JobStatus, number> = {} as Record<JobStatus, number>

      for (const status of statuses) {
        let count = 0
        if (status === 'delayed') {
          count = await this.redisClient.send('ZCARD', [this.getKey(status)]) as number
        }
        else if (status === 'paused') {
          const exists = await this.redisClient.exists(this.getKey(status))
          count = exists ? 1 : 0
        }
        else {
          count = await this.redisClient.send('LLEN', [this.getKey(status)]) as number
        }
        counts[status] = count
      }

      return counts
    }
    catch (err) {
      this.logger.error(`Error getting job counts for queue ${this.name}: ${(err as Error).message}`)
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        paused: 0,
      }
    }
  }

  /**
   * Clear all jobs from the queue
   */
  async empty(): Promise<void> {
    try {
      const keys = await this.redisClient.keys(`${this.keyPrefix}:*`)

      if (keys.length) {
        await this.redisClient.send('DEL', keys)
      }

      this.logger.info(`Queue ${this.name} emptied`)
    }
    catch (err) {
      this.logger.error(`Error emptying queue ${this.name}: ${(err as Error).message}`)
    }
  }

  /**
   * Check Redis connection health
   */
  async ping(): Promise<boolean> {
    try {
      const response = await this.redisClient.send('PING', [])
      return response === 'PONG'
    }
    catch (error) {
      this.logger.error(`Connection error: ${(error as Error).message}`)
      return false
    }
  }

  /**
   * Convert key name to prefixed key
   */
  getKey(name: string): string {
    return `${this.keyPrefix}:${name}`
  }

  /**
   * Get the job key
   */
  getJobKey(jobId: string): string {
    return `${this.keyPrefix}:job:${jobId}`
  }

  /**
   * Check if the queue is rate limited for a specific key
   */
  async isRateLimited(key?: string, data?: T): Promise<{ limited: boolean, resetIn: number }> {
    if (!this.limiter) {
      return { limited: false, resetIn: 0 }
    }

    let result: RateLimitResult

    if (key) {
      // Use explicit key if provided
      result = await this.limiter.checkByKey(key)
    }
    else {
      // Use data with keyPrefix from limiter options
      result = await this.limiter.check(data)
    }

    return {
      limited: result.limited,
      resetIn: result.resetIn,
    }
  }

  /**
   * Process a job with a distributed lock to prevent race conditions
   * @param jobId The job ID
   * @param handler The processing function
   */
  async processJobWithLock(jobId: string, handler: (job: Job<T>) => Promise<any>): Promise<any> {
    // If locks are disabled, just process the job directly
    if (!this.lock) {
      const job = await this.getJob(jobId)
      if (!job)
        return null
      return handler(job)
    }

    // Get a lock for this specific job
    const lockResource = `job:${jobId}`

    try {
      // Try to get the lock with a reasonable timeout and retries
      return await this.lock.withLock(lockResource, async () => {
        // Now we have the lock, fetch the job and process it
        const job = await this.getJob(jobId)
        if (!job)
          return null

        // Process the job with the lock held
        this.logger.debug(`Processing job ${jobId} with distributed lock`)
        return handler(job)
      }, {
        duration: 30000, // 30 second lock
        retries: 3, // Try 3 times to get the lock
        retryDelay: 200, // 200ms between retries
      })
    }
    catch (error) {
      this.logger.error(`Failed to acquire lock for job ${jobId}: ${(error as Error).message}`)
      throw error
    }
  }

  /**
   * Get the distributed lock instance
   */
  getLock(): DistributedLock | null {
    return this.lock
  }

  /**
   * Schedule a recurring job using cron syntax
   * @param options Cron job options including the cron expression
   * @returns The scheduled job ID
   */
  async scheduleCron(options: CronJobOptions): Promise<string> {
    if (!this.cronScheduler) {
      throw new Error('Cron scheduler not initialized')
    }

    return this.cronScheduler.schedule(options)
  }

  /**
   * Unschedule a cron job
   * @param jobId The ID of the job to unschedule
   * @returns True if successfully unscheduled
   */
  async unscheduleCron(jobId: string): Promise<boolean> {
    if (!this.cronScheduler) {
      throw new Error('Cron scheduler not initialized')
    }

    return this.cronScheduler.unschedule(jobId)
  }

  getDeadLetterQueue(): DeadLetterQueue<T> {
    if (!this.deadLetterQueue) {
      this.deadLetterQueue = new DeadLetterQueue<T>(this, this.defaultDeadLetterOptions)
    }
    return this.deadLetterQueue
  }

  /**
   * Get default dead letter queue options
   */
  getDefaultDeadLetterOptions(): DeadLetterQueueOptions | undefined {
    return this.defaultDeadLetterOptions
  }

  /**
   * Move a job to the dead letter queue
   */
  async moveToDeadLetter(jobId: string, reason: string): Promise<boolean> {
    const job = await this.getJob(jobId)
    if (!job) {
      return false
    }

    const dlq = this.getDeadLetterQueue()
    await dlq.moveToDeadLetter(job, reason)
    return true
  }

  /**
   * Get jobs from the dead letter queue
   */
  async getDeadLetterJobs(start = 0, end = -1): Promise<Job<T>[]> {
    const dlq = this.getDeadLetterQueue()
    return dlq.getJobs(start, end)
  }

  /**
   * Republish a job from the dead letter queue
   */
  async republishDeadLetterJob(jobId: string, options: { resetRetries?: boolean } = {}): Promise<Job<T> | null> {
    const dlq = this.getDeadLetterQueue()
    return dlq.republishJob(jobId, options)
  }

  /**
   * Remove a job from the dead letter queue
   */
  async removeDeadLetterJob(jobId: string): Promise<boolean> {
    const dlq = this.getDeadLetterQueue()
    return dlq.removeJob(jobId)
  }

  /**
   * Clear the dead letter queue
   */
  async clearDeadLetterQueue(): Promise<void> {
    const dlq = this.getDeadLetterQueue()
    return dlq.clear()
  }

  /**
   * Remove multiple jobs from the queue in a single operation
   * @param jobIds Array of job IDs to remove
   * @returns Number of jobs successfully removed
   */
  async bulkRemove(jobIds: string[]): Promise<number> {
    if (!jobIds.length)
      return 0

    try {
      // Use pipeline for better performance
      await this.redisClient.send('MULTI', [])

      // Keep track of successful removes
      let removedCount = 0

      for (const jobId of jobIds) {
        const jobKey = this.getJobKey(jobId)

        // Check if job exists first
        const exists = await this.redisClient.exists(jobKey)
        if (!exists)
          continue

        // Remove from all possible lists
        const statusLists = ['active', 'waiting', 'completed', 'failed', 'dependency-wait']
        for (const list of statusLists) {
          await this.redisClient.send('LREM', [this.getKey(list), '0', jobId])
          await this.redisClient.send('SREM', [this.getKey(list), jobId])
        }

        // Remove from delayed set
        await this.redisClient.send('ZREM', [this.getKey('delayed'), jobId])

        // Remove dependent jobs links
        const dependentKey = `${jobKey}:dependents`

        // Remove the job hash and the dependent key
        await this.redisClient.send('DEL', [jobKey, dependentKey])

        removedCount++

        // Emit event
        this.events.emitJobRemoved(jobId)
      }

      // Execute all commands
      await this.redisClient.send('EXEC', [])

      this.logger.debug(`Bulk removed ${removedCount} jobs from queue ${this.name}`)
      return removedCount
    }
    catch (err) {
      this.logger.error(`Error in bulk remove operation for queue ${this.name}: ${(err as Error).message}`)
      return 0
    }
  }

  /**
   * Pause multiple jobs (move them from waiting/delayed to paused state)
   * @param jobIds Array of job IDs to pause
   * @returns Number of jobs successfully paused
   */
  async bulkPause(jobIds: string[]): Promise<number> {
    if (!jobIds.length)
      return 0

    try {
      // Use pipeline for better performance
      await this.redisClient.send('MULTI', [])

      let pausedCount = 0

      for (const jobId of jobIds) {
        const jobKey = this.getJobKey(jobId)

        // Check if job exists
        const exists = await this.redisClient.exists(jobKey)
        if (!exists)
          continue

        // Check if it's in waiting or delayed
        const isWaiting = await this.redisClient.send('LREM', [this.getKey('waiting'), '0', jobId])
        const isDelayed = await this.redisClient.send('ZREM', [this.getKey('delayed'), jobId])

        if ((isWaiting && isWaiting > 0) || (isDelayed && isDelayed > 0)) {
          // Add to paused list
          await this.redisClient.send('LPUSH', [this.getKey('paused'), jobId])

          // Update job status
          await this.redisClient.send('HSET', [jobKey, 'status', 'paused'])

          pausedCount++
          this.logger.debug(`Job ${jobId} paused`)
        }
      }

      // Execute all commands
      await this.redisClient.send('EXEC', [])

      this.logger.debug(`Bulk paused ${pausedCount} jobs in queue ${this.name}`)
      return pausedCount
    }
    catch (err) {
      this.logger.error(`Error in bulk pause operation for queue ${this.name}: ${(err as Error).message}`)
      return 0
    }
  }

  /**
   * Resume multiple paused jobs (move them from paused to waiting state)
   * @param jobIds Array of job IDs to resume
   * @returns Number of jobs successfully resumed
   */
  async bulkResume(jobIds: string[]): Promise<number> {
    if (!jobIds.length)
      return 0

    try {
      // Use pipeline for better performance
      await this.redisClient.send('MULTI', [])

      let resumedCount = 0

      for (const jobId of jobIds) {
        const jobKey = this.getJobKey(jobId)

        // Check if job exists
        const exists = await this.redisClient.exists(jobKey)
        if (!exists)
          continue

        // Check if it's in paused list
        const isPaused = await this.redisClient.send('LREM', [this.getKey('paused'), '0', jobId])

        if (isPaused && isPaused > 0) {
          // Add back to waiting list
          await this.redisClient.send('LPUSH', [this.getKey('waiting'), jobId])

          // Update job status
          await this.redisClient.send('HSET', [jobKey, 'status', 'waiting'])

          resumedCount++
          this.logger.debug(`Job ${jobId} resumed`)
        }
      }

      // Execute all commands
      await this.redisClient.send('EXEC', [])

      this.logger.debug(`Bulk resumed ${resumedCount} jobs in queue ${this.name}`)
      return resumedCount
    }
    catch (err) {
      this.logger.error(`Error in bulk resume operation for queue ${this.name}: ${(err as Error).message}`)
      return 0
    }
  }
}
