import type { Job } from '../src/classes'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import IORedis from 'ioredis'
import { v4 } from 'uuid'
import { Queue, QueueEvents, Worker } from '../src/classes'
import { delay, removeAllQueueData } from '../src/utils'

// Helper function for testing completion after N calls
function _after(count: number, fn: (...args: any[]) => void) {
  let callCount = 0
  return (...args: any[]) => {
    callCount++
    if (callCount === count) {
      return fn(...args)
    }
  }
}

describe('Delayed jobs', () => {
  const redisHost = process.env.REDIS_HOST || 'localhost'
  const prefix = process.env.BULLMQ_TEST_PREFIX || 'bull'

  let queue: Queue
  let queueName: string

  let connection: IORedis
  beforeAll(async () => {
    connection = new IORedis(redisHost, { maxRetriesPerRequest: null })
  })

  beforeEach(async () => {
    queueName = `test-${v4()}`
    queue = new Queue(queueName, { connection, prefix })
    await queue.waitUntilReady()
  })

  afterEach(async () => {
    await queue.close()
    await removeAllQueueData(new IORedis(redisHost), queueName)
  })

  afterAll(async () => {
    await connection.quit()
  })

  it('should process a delayed job only after delayed time', async () => {
    const delay = 1000
    const margin = 1.2

    const queueEvents = new QueueEvents(queueName, { connection, prefix })
    await queueEvents.waitUntilReady()

    const worker = new Worker(queueName, async () => {}, {
      connection,
      prefix,
    })
    await worker.waitUntilReady()

    const timestamp = Date.now()
    let publishHappened = false

    const delayed = new Promise<void>((resolve) => {
      queueEvents.on('delayed', () => {
        publishHappened = true
        resolve()
      })
    })

    const completed = new Promise<void>((resolve, reject) => {
      worker.on('completed', async (job) => {
        try {
          expect(Date.now() > timestamp + delay).toBeTruthy()
          expect(job.processedOn! - job.timestamp).toBeGreaterThanOrEqual(
            delay,
          )
          expect(
            job.processedOn! - job.timestamp,
            'processedOn is not within margin',
          ).toBeLessThan(delay * margin)

          const jobs = await queue.getWaiting()
          expect(jobs.length).toBe(0)

          const delayedJobs = await queue.getDelayed()
          expect(delayedJobs.length).toBe(0)
          expect(publishHappened).toBeTruthy()
          resolve()
        }
        catch (err) {
          reject(err)
        }
      })
    })

    const job = await queue.add('test', { delayed: 'foobar' }, { delay })

    expect(job.id).toBeTruthy()
    expect(job.data.delayed).toBe('foobar')
    expect(job.opts.delay).toBe(delay)
    expect(job.delay).toBe(delay)

    await delayed
    await completed
    await queueEvents.close()
    await worker.close()
  }, 15000)

  describe('when markers are deleted', () => {
    it('should process a delayed job without getting stuck', async () => {
      const delayTime = 6000
      const margin = 1.2

      const queueEvents = new QueueEvents(queueName, { connection, prefix })
      await queueEvents.waitUntilReady()

      const worker = new Worker(queueName, async () => {}, {
        connection,
        autorun: false,
        prefix,
      })
      await worker.waitUntilReady()

      const timestamp = Date.now()
      let publishHappened = false

      const delayed = new Promise<void>((resolve) => {
        queueEvents.on('delayed', () => {
          publishHappened = true
          resolve()
        })
      })

      const completed = new Promise<void>((resolve, reject) => {
        worker.on('completed', async (job) => {
          try {
            expect(Date.now() > timestamp + delayTime).toBeTruthy()
            expect(job.processedOn! - job.timestamp).toBeGreaterThanOrEqual(
              delayTime,
            )
            expect(
              job.processedOn! - job.timestamp,
              'processedOn is not within margin',
            ).toBeLessThan(delayTime * margin)

            const jobs = await queue.getWaiting()
            expect(jobs.length).toBe(0)

            const delayedJobs = await queue.getDelayed()
            expect(delayedJobs.length).toBe(0)
            expect(publishHappened).toBeTruthy()
            resolve()
          }
          catch (err) {
            reject(err)
          }
        })
      })

      const job = await queue.add(
        'test',
        { delayed: 'foobar' },
        { delay: delayTime },
      )

      expect(job.id).toBeTruthy()
      expect(job.data.delayed).toBe('foobar')
      expect(job.opts.delay).toBe(delayTime)
      expect(job.delay).toBe(delayTime)

      await delayed

      const client = await queue.client
      await client.del(queue.toKey('marker'))

      worker.run()

      await delay(2000)

      await client.del(queue.toKey('marker'))

      await completed
      await queueEvents.close()
      await worker.close()
    }, 15000)
  })

  describe('when delay is provided as 0', () => {
    describe('when priority is not provided', () => {
      it('should add job directly into wait state', async () => {
        const job = await queue.add('test', {}, { delay: 0 })

        const state = await job.getState()
        expect(state).toBe('waiting')
      })
    })

    describe('when priority is provided', () => {
      it('should add job directly into prioritized state', async () => {
        const job = await queue.add('test', {}, { delay: 0, priority: 1 })

        const state = await job.getState()
        expect(state).toBe('prioritized')
      })
    })
  })

  describe('when queue is paused', () => {
    it('should keep moving delayed jobs to waiting', async () => {
      const delayTime = 2500
      const margin = 1.2

      const queueEvents = new QueueEvents(queueName, { connection, prefix })
      await queueEvents.waitUntilReady()

      await queue.pause()
      const worker = new Worker(queueName, async () => {}, {
        connection,
        prefix,
      })
      await worker.waitUntilReady()

      const timestamp = Date.now()

      const waiting = new Promise<void>((resolve) => {
        queueEvents.on('waiting', () => {
          const currentDelay = Date.now() - timestamp
          expect(currentDelay).toBeGreaterThanOrEqual(delayTime)
          expect(currentDelay).toBeLessThanOrEqual(delayTime * margin)
          resolve()
        })
      })

      await queue.add('test', { delayed: 'foobar' }, { delay: delayTime })

      await waiting

      await queueEvents.close()
      await worker.close()
    })
  })

  it('should process a delayed job added after an initial long delayed job', async () => {
    const oneYearDelay = 1000 * 60 * 60 * 24 * 365 // One year.
    const delayTime = 1000
    const margin = 1.2

    const queueEvents = new QueueEvents(queueName, { connection, prefix })
    await queueEvents.waitUntilReady()

    const worker = new Worker(queueName, async () => {}, {
      connection,
      prefix,
    })
    await worker.waitUntilReady()

    const timestamp = Date.now()
    let publishHappened = false

    const delayed = new Promise<void>((resolve) => {
      queueEvents.on('delayed', () => {
        publishHappened = true
        resolve()
      })
    })

    const completed = new Promise<void>((resolve, reject) => {
      worker.on('completed', async (job) => {
        try {
          expect(Date.now() > timestamp + delayTime).toBeTruthy()
          expect(job.processedOn! - job.timestamp).toBeGreaterThanOrEqual(
            delayTime,
          )
          expect(
            job.processedOn! - job.timestamp,
            'processedOn is not within margin',
          ).toBeLessThan(delayTime * margin)

          const jobs = await queue.getWaiting()
          expect(jobs.length).toBe(0)

          const delayedJobs = await queue.getDelayed()
          expect(delayedJobs.length).toBe(1)
          expect(publishHappened).toBeTruthy()
          resolve()
        }
        catch (err) {
          reject(err)
        }
      })
    })

    await queue.add('test', { delayed: 'foobar' }, { delay: oneYearDelay })

    await delay(1000)

    const job = await queue.add(
      'test',
      { delayed: 'foobar' },
      { delay: delayTime },
    )

    expect(job.id).toBeTruthy()
    expect(job.data.delayed).toBe('foobar')
    expect(job.opts.delay).toBe(delayTime)
    expect(job.delay).toBe(delayTime)

    await delayed
    await completed

    const count = await queue.getJobCountByTypes('active')
    expect(count).toBe(0)

    await queueEvents.close()
    await worker.close()
  }, 15000)

  it('should process delayed jobs in correct order respecting delay', async () => {
    let order = 0
    const numJobs = 12
    const margin = 1.2

    let processor

    const processing = new Promise<void>((resolve, reject) => {
      processor = async (job: Job) => {
        order++
        try {
          expect(order).toBe(job.data.order)
          expect(job.processedOn! - job.timestamp).toBeGreaterThanOrEqual(
            job.opts.delay ?? 0,
          )
          expect(
            job.processedOn! - job.timestamp,
            'processedOn is not within margin',
          ).toBeLessThan((job.opts.delay ?? 0) * margin)

          if (order === numJobs) {
            resolve()
          }
        }
        catch (err) {
          reject(err)
        }
      }
    })

    const worker = new Worker(queueName, processor, {
      autorun: false,
      connection,
      prefix,
    })

    worker.on('failed', (_job, _err) => {})

    const jobs = Array.from(Array.from({ length: numJobs }).keys()).map(index => ({
      name: 'test',
      data: { order: numJobs - index },
      opts: {
        delay: 500 + (numJobs - index) * 150,
      },
    }))

    await queue.addBulk(jobs)
    worker.run()
    await processing
    await worker.close()
  }, 7500)

  it('should process delayed jobs with several workers respecting delay', async () => {
    let count = 0
    const numJobs = 50
    const margin = 1.3

    let processor1, processor2

    const createProcessor
      = (
        name: string,
        resolve: (value: void | PromiseLike<void>) => void,
        reject: (reason: any) => void,
      ) =>
        async (job: Job) => {
          count++
          try {
            const delayed = job.processedOn! - job.timestamp
            expect(
              delayed,
              'waited at least delay time',
            ).toBeGreaterThanOrEqual(job.opts.delay ?? 0)
            expect(delayed, 'processedOn is not within margin').toBeLessThan(
              (job.opts.delay ?? 0) * margin,
            )

            if (count === numJobs) {
              resolve()
            }
          }
          catch (err) {
            reject(err)
          }

          await delay(100)
        }

    const processing = new Promise<void>((resolve, reject) => {
      processor1 = createProcessor('worker 1', resolve, reject)
      processor2 = createProcessor('worker 2', resolve, reject)
    })

    const worker = new Worker(queueName, processor1, {
      connection,
      prefix,
      concurrency: numJobs / 2,
    })

    const worker2 = new Worker(queueName, processor2, {
      connection,
      prefix,
      concurrency: numJobs / 2,
    })

    await worker.waitUntilReady()
    await worker2.waitUntilReady()

    const jobs = Array.from(Array.from({ length: numJobs }).keys()).map(index => ({
      name: 'test',
      data: { order: numJobs - index },
      opts: {
        delay: 500 + (numJobs - index),
      },
    }))

    await queue.addBulk(jobs)
    await processing
    await worker.close()
    await worker2.close()
  }, 30000)

  // Add test where delays overlap so that we can see that indeed the jobs are processed concurrently.
  it('should process delayed jobs concurrently respecting delay and concurrency', async () => {
    const delay_ = 250
    const concurrency = 100
    const margin = 1.5
    let numJobs = 10

    const worker = new Worker(
      queueName,
      async (job) => {
        const delayed = Date.now() - job.timestamp
        try {
          expect(
            delayed,
            'waited at least delay time',
          ).toBeGreaterThanOrEqual(delay_)
          expect(
            delayed,
            'waited less than delay time and margin',
          ).toBeLessThan(delay_ * margin)
        }
        catch (err) {
          console.error(err)
        }
        if (!numJobs) {
          // Will be resolved naturally when all jobs are processed
        }
      },
      { connection, prefix, concurrency },
    )

    // Wait until worker is ready
    await worker.waitUntilReady()

    // Process jobs
    let index = 1
    while (numJobs) {
      numJobs -= 1
      await queue.add('my-queue', { foo: 'bar', index }, { delay: delay_ })
      index += 1
      if (numJobs) {
        await delay(1000)
      }
    }

    // Wait for jobs to be processed
    await delay(2000)

    await worker.close()
  })

  it('should process delayed jobs with exact same timestamps in correct order (FIFO)', async () => {
    let order = 1
    const numJobs = 43

    const worker = new Worker(
      queueName,
      async (job: Job) => {
        try {
          expect(order).toBe(job.data.order)

          if (order === numJobs) {
            // Will be resolved naturally when all jobs are processed
          }
        }
        catch (err) {
          console.error(err)
        }

        order++
      },
      { connection, prefix },
    )

    await worker.waitUntilReady()

    // Handle failure
    worker.on('failed', (_job, _err) => {
      console.error('Job failed unexpectedly')
    })

    const now = Date.now()
    let i = 1
    for (i; i <= numJobs; i++) {
      await queue.add(
        'test',
        { order: i },
        {
          delay: 1000,
          timestamp: now,
        },
      )
    }

    // Wait for jobs to be processed
    await delay(5000)

    await worker.close()
  })

  describe('when autorun option is provided as false', () => {
    it('should process a delayed job only after delayed time', async () => {
      const delay = 1000
      const queueEvents = new QueueEvents(queueName, { connection, prefix })
      await queueEvents.waitUntilReady()

      const worker = new Worker(queueName, async () => {}, {
        connection,
        prefix,
        autorun: false,
      })
      await worker.waitUntilReady()

      const timestamp = Date.now()
      let publishHappened = false

      const delayed = new Promise<void>((resolve) => {
        queueEvents.on('delayed', () => {
          publishHappened = true
          resolve()
        })
      })

      const completed = new Promise<void>((resolve, reject) => {
        queueEvents.on('completed', async () => {
          try {
            expect(Date.now() > timestamp + delay).toBeTruthy()
            const jobs = await queue.getWaiting()
            expect(jobs.length).toBe(0)

            const delayedJobs = await queue.getDelayed()
            expect(delayedJobs.length).toBe(0)
            expect(publishHappened).toBeTruthy()
            resolve()
          }
          catch (err) {
            reject(err)
          }
        })
      })

      const job = await queue.add('test', { delayed: 'foobar' }, { delay })

      expect(job.id).toBeTruthy()
      expect(job.data.delayed).toBe('foobar')
      expect(job.opts.delay).toBe(delay)

      worker.run()

      await delayed
      await completed
      await queueEvents.close()
      await worker.close()
    })
  })

  describe('when failed jobs are retried and moved to delayed', () => {
    it('processes jobs without getting stuck', async () => {
      const countJobs = 2
      const concurrency = 50

      const processedJobs: { data: any }[] = []
      const worker = new Worker(
        queueName,
        async (job: Job) => {
          if (job.attemptsMade === 0) {
            await delay(250)
            throw new Error('forced error in test')
          }

          await delay(25)

          processedJobs.push({ data: job.data })
        },
        {
          autorun: false,
          connection,
          prefix,
          concurrency,
        },
      )
      worker.on('error', (err) => {
        console.error(err)
      })

      const completed = new Promise<void>((resolve) => {
        worker.on(
          'completed',
          _after(countJobs, async () => {
            resolve()
          }),
        )
      })

      worker.run()

      for (let j = 0; j < countJobs; j++) {
        await queue.add(
          'test',
          { foo: `bar${j}` },
          { attempts: 2, backoff: 10 },
        )
      }

      await completed

      expect(processedJobs.length).toBe(countJobs)

      const count = await queue.getJobCountByTypes('failed', 'wait', 'delayed')
      expect(count).toBe(0)

      await worker.close()
    }, 4000)
  })
})
