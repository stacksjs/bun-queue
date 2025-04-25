import type { RedisClient } from 'bun'
import type { JobOptions, JobStatus, QueueConfig } from './types'
import { CleanupService } from './cleanup'
import { scriptLoader } from './commands'
import { config } from './config'
import { CronScheduler, type CronJobOptions } from './cron-scheduler'
import { DistributedLock } from './distributed-lock'
import { JobEvents } from './events'
import { Job } from './job'
import { createLogger } from './logger'
import { Metrics } from './metrics'
import { StalledJobChecker } from './stalled-checker'
import { generateId, getRedisClient, mergeOptions } from './utils'
import { Worker } from './worker'
import { RateLimiter } from './rate-limiter'
import type { RateLimitResult } from './rate-limiter'

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

  constructor(name: string, options?: QueueConfig) {
    this.name = name
    this.prefix = options?.prefix || config.prefix || 'queue'
    this.redisClient = getRedisClient(options)
    this.keyPrefix = `${this.prefix}:${this.name}`
    this.events = new JobEvents(name)
    this.defaultJobOptions = options?.defaultJobOptions

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
            delay: limiterResult.resetIn
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
   * Process jobs with a handler function
   */
  process(concurrency: number, handler: (job: Job<T>) => Promise<any>): void {
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

  /**
   * Stop processing jobs
   */
  async close(): Promise<void> {
    try {
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
  async isRateLimited(key?: string, data?: T): Promise<{ limited: boolean; resetIn: number }> {
    if (!this.limiter) {
      return { limited: false, resetIn: 0 }
    }

    let result: RateLimitResult

    if (key) {
      // Use explicit key if provided
      result = await this.limiter.checkByKey(key)
    } else {
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
      if (!job) return null
      return handler(job)
    }

    // Get a lock for this specific job
    const lockResource = `job:${jobId}`

    try {
      // Try to get the lock with a reasonable timeout and retries
      return await this.lock.withLock(lockResource, async () => {
        // Now we have the lock, fetch the job and process it
        const job = await this.getJob(jobId)
        if (!job) return null

        // Process the job with the lock held
        this.logger.debug(`Processing job ${jobId} with distributed lock`)
        return handler(job)
      }, {
        duration: 30000, // 30 second lock
        retries: 3,      // Try 3 times to get the lock
        retryDelay: 200  // 200ms between retries
      })
    } catch (error) {
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
}
