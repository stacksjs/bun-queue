import type { Job } from './job'
import type { Queue } from './queue'

export class Worker<T = any> {
  queue: Queue<T>
  concurrency: number
  handler: (job: Job<T>) => Promise<any>
  processing: Map<string, Promise<any>>
  running: boolean
  timer: NodeJS.Timeout | null

  constructor(
    queue: Queue<T>,
    concurrency: number,
    handler: (job: Job<T>) => Promise<any>,
  ) {
    this.queue = queue
    this.concurrency = concurrency
    this.handler = handler
    this.processing = new Map()
    this.running = false
    this.timer = null
  }

  /**
   * Start processing jobs
   */
  start(): void {
    if (this.running)
      return
    this.running = true
    this.processTick()
  }

  /**
   * Stop processing jobs
   */
  async stop(timeout = 10000): Promise<void> {
    this.running = false

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    // Wait for all processing jobs to complete with timeout
    if (this.processing.size > 0) {
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn(`Worker shutdown timed out with ${this.processing.size} jobs still processing`)
          resolve()
        }, timeout)
      })

      await Promise.race([
        Promise.all(this.processing.values()),
        timeoutPromise,
      ])
    }
  }

  /**
   * Process tick
   */
  private processTick(): void {
    if (!this.running)
      return

    // Process if we have capacity
    if (this.processing.size < this.concurrency) {
      this.processJobs()
    }

    // Schedule next tick
    this.timer = setTimeout(() => this.processTick(), 50)
  }

  /**
   * Process available jobs
   */
  private async processJobs(): Promise<void> {
    try {
      // Check if queue is paused
      const isPaused = await this.queue.redisClient.exists(this.queue.getKey('paused'))
      if (isPaused) {
        return
      }

      // Process delayed jobs that are ready
      await this.moveDelayedJobsToWaiting()

      // Get jobs to process
      const availableSlots = this.concurrency - this.processing.size
      if (availableSlots <= 0)
        return

      const waitingJobs = await this.queue.redisClient.send('LRANGE', [
        this.queue.getKey('waiting'),
        '0',
        (availableSlots - 1).toString(),
      ])

      if (!waitingJobs || waitingJobs.length === 0)
        return

      // Move jobs to active and process them
      for (const jobId of waitingJobs) {
        // Skip if already processing
        if (this.processing.has(jobId))
          continue

        // Move to active and process
        await this.moveToActive(jobId)
        this.processJob(jobId)
      }
    }
    catch (err) {
      console.error('Error processing jobs', err)
    }
  }

  /**
   * Process a single job
   */
  private processJob(jobId: string): void {
    const promise = (async () => {
      try {
        // Use the queue's processJobWithLock method if available,
        // which provides distributed locking to prevent race conditions
        if ('processJobWithLock' in this.queue && typeof this.queue.processJobWithLock === 'function') {
          // Process with distributed lock for better concurrency safety
          await this.queue.processJobWithLock(jobId, async (job) => {
            if (!job)
              return

            // Set processedOn timestamp
            const jobKey = this.queue.getJobKey(jobId)
            const now = Date.now()
            await this.queue.redisClient.send('HSET', [jobKey, 'processedOn', now.toString()])
            job.processedOn = now

            // Process the job
            const result = await this.handler(job)

            // Mark as completed
            await job.moveToCompleted(result)
            return result
          })
        }
        else {
          // Fallback to traditional processing without distributed lock
          const job = await this.queue.getJob(jobId)
          if (!job)
            return

          // Set processedOn timestamp
          const jobKey = this.queue.getJobKey(jobId)
          const now = Date.now()
          await this.queue.redisClient.send('HSET', [jobKey, 'processedOn', now.toString()])
          job.processedOn = now

          // Process the job
          const result = await this.handler(job)

          // Mark as completed
          await job.moveToCompleted(result)
        }
      }
      catch (err) {
        // Log the error
        console.error(`Error processing job ${jobId}:`, err)

        // Get the job again to ensure we have latest data
        const job = await this.queue.getJob(jobId)
        if (!job)
          return

        await job.moveToFailed(err as Error)

        // Check for retry
        const maxAttempts = job.opts.attempts || 1

        // Check if we should move to dead letter queue
        const useDeadLetter = job.opts.deadLetter !== undefined
          ? job.opts.deadLetter
          : this.queue.getDefaultDeadLetterOptions()?.enabled

        const deadLetterMaxRetries = (typeof job.opts.deadLetter === 'object' && job.opts.deadLetter !== null
          ? job.opts.deadLetter.maxRetries
          : this.queue.getDefaultDeadLetterOptions()?.maxRetries) || 3

        // Move to dead letter queue if we've exceeded max retries
        if (useDeadLetter && job.attemptsMade >= deadLetterMaxRetries) {
          await this.queue.moveToDeadLetter(job.id, `Failed after ${job.attemptsMade} attempts`)
          return
        }

        if (job.attemptsMade < maxAttempts) {
          // Calculate delay for retry based on backoff strategy
          let delay = 0
          if (job.opts.backoff) {
            if (job.opts.backoff.type === 'fixed') {
              delay = job.opts.backoff.delay
            }
            else if (job.opts.backoff.type === 'exponential') {
              delay = job.opts.backoff.delay * 2 ** (job.attemptsMade - 1)
            }
          }

          if (delay > 0) {
            // Add to delayed set
            const processAt = Date.now() + delay
            await this.queue.redisClient.send('ZADD', [
              this.queue.getKey('delayed'),
              processAt.toString(),
              jobId,
            ])
          }
          else {
            // Retry immediately
            await job.retry()
          }
        }
      }
      finally {
        this.processing.delete(jobId)
      }
    })()

    this.processing.set(jobId, promise)
  }

  /**
   * Move a job from waiting to active
   */
  private async moveToActive(jobId: string): Promise<void> {
    await this.queue.redisClient.send('MULTI', [])
    await this.queue.redisClient.send('LREM', [this.queue.getKey('waiting'), '1', jobId])
    await this.queue.redisClient.send('LPUSH', [this.queue.getKey('active'), jobId])
    await this.queue.redisClient.send('EXEC', [])
  }

  /**
   * Move delayed jobs that are ready to waiting
   */
  private async moveDelayedJobsToWaiting(): Promise<void> {
    const now = Date.now()

    // Get delayed jobs that are ready
    const jobs = await this.queue.redisClient.send('ZRANGEBYSCORE', [
      this.queue.getKey('delayed'),
      '0',
      now.toString(),
    ])

    if (!jobs || jobs.length === 0)
      return

    for (const jobId of jobs) {
      await this.queue.redisClient.send('MULTI', [])
      await this.queue.redisClient.send('ZREM', [this.queue.getKey('delayed'), jobId])
      await this.queue.redisClient.send('LPUSH', [this.queue.getKey('waiting'), jobId])
      await this.queue.redisClient.send('EXEC', [])
    }
  }

  /**
   * Adjust the concurrency level dynamically
   */
  adjustConcurrency(newConcurrency: number): void {
    if (newConcurrency <= 0) {
      throw new Error('Concurrency must be greater than 0')
    }

    this.concurrency = newConcurrency

    // If we're reducing concurrency and have more jobs processing than the new limit,
    // we won't interrupt them, but will let them complete naturally.
    // New jobs will adhere to the new concurrency limit.
  }
}
