import type { Job } from '../src/classes'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import process from 'node:process'
import { default as IORedis } from 'ioredis'
import { v4 } from 'uuid'
import { Queue, QueueEvents, Worker } from '../src/classes'
import { delay, removeAllQueueData } from '../src/utils'

describe('bulk jobs', () => {
  const redisHost = process.env.REDIS_HOST || 'localhost'
  const prefix = process.env.BULLMQ_TEST_PREFIX || 'bull'

  let queue: Queue
  let queueName: string

  let connection
  beforeAll(async () => {
    connection = new IORedis(redisHost, { maxRetriesPerRequest: null })
  })

  beforeEach(async () => {
    queueName = `test-${v4()}`
    queue = new Queue(queueName, { connection, prefix })
  })

  afterEach(async () => {
    await queue.close()
    await removeAllQueueData(new IORedis(redisHost), queueName)
  })

  after(async () => {
    await connection.quit()
  })

  it('should process jobs', async () => {
    const name = 'test'
    let processor
    const processing = new Promise<void>(
      resolve =>
        (processor = async (job: Job) => {
          if (job.data.idx === 0) {
            expect(job.data.foo).toBe('bar')
          }
          else {
            expect(job.data.idx).toBe(1)
            expect(job.data.foo).toBe('baz')
            resolve()
          }
        }),
    )
    const worker = new Worker(queueName, processor, { connection, prefix })
    await worker.waitUntilReady()

    const jobs = await queue.addBulk([
      { name, data: { idx: 0, foo: 'bar' } },
      { name, data: { idx: 1, foo: 'baz' } },
    ])
    expect(jobs).to.have.length(2)

    expect(jobs[0].id).to.be.ok
    expect(jobs[0].data.foo).toBe('bar')
    expect(jobs[1].id).to.be.ok
    expect(jobs[1].data.foo).toBe('baz')

    await processing
    await worker.close()
  })

  it('should allow to pass parent option', async () => {
    const name = 'test'
    const parentQueueName = `parent-queue-${v4()}`
    const parentQueue = new Queue(parentQueueName, { connection, prefix })

    const parentWorker = new Worker(parentQueueName, null, {
      connection,
      prefix,
    })
    const childrenWorker = new Worker(queueName, null, { connection, prefix })
    await parentWorker.waitUntilReady()
    await childrenWorker.waitUntilReady()

    const parent = await parentQueue.add('parent', { some: 'data' })
    const jobs = await queue.addBulk([
      {
        name,
        data: { idx: 0, foo: 'bar' },
        opts: {
          parent: {
            id: parent.id!,
            queue: `${prefix}:${parentQueueName}`,
          },
        },
      },
      {
        name,
        data: { idx: 1, foo: 'baz' },
        opts: {
          parent: {
            id: parent.id!,
            queue: `${prefix}:${parentQueueName}`,
          },
        },
      },
    ])
    expect(jobs).to.have.length(2)

    expect(jobs[0].id).to.be.ok
    expect(jobs[0].data.foo).toBe('bar')
    expect(jobs[1].id).to.be.ok
    expect(jobs[1].data.foo).toBe('baz')

    const { unprocessed } = await parent.getDependenciesCount({
      unprocessed: true,
    })

    expect(unprocessed).toBe(2)

    await childrenWorker.close()
    await parentWorker.close()
    await parentQueue.close()
    await removeAllQueueData(new IORedis(redisHost), parentQueueName)
  })

  it('should keep workers busy', async () => {
    const numJobs = 6
    const queueEvents = new QueueEvents(queueName, { connection, prefix })
    await queueEvents.waitUntilReady()

    const worker = new Worker(
      queueName,
      async () => {
        await delay(900)
      },
      { connection, prefix },
    )
    const worker2 = new Worker(
      queueName,
      async () => {
        await delay(900)
      },
      { connection, prefix },
    )
    await worker.waitUntilReady()
    await worker2.waitUntilReady()

    let counter = 0
    const completed = new Promise<void>((resolve) => {
      queueEvents.on('completed', () => {
        counter++
        if (counter === numJobs) {
          resolve()
        }
      })
    })

    const jobs = Array.from(Array.from({ length: numJobs }).keys()).map(index => ({
      name: 'test',
      data: { index },
    }))

    await queue.addBulk(jobs)

    await completed
    await worker.close()
    await worker2.close()
    await queueEvents.close()
  }).timeout(10_000)

  it('should process jobs with custom ids', async () => {
    const name = 'test'
    let processor
    const processing = new Promise<void>(
      resolve =>
        (processor = async (job: Job) => {
          if (job.data.idx === 0) {
            expect(job.data.foo).toBe('bar')
          }
          else {
            expect(job.data.idx).toBe(1)
            expect(job.data.foo).toBe('baz')
            resolve()
          }
        }),
    )
    const worker = new Worker(queueName, processor, { connection, prefix })
    await worker.waitUntilReady()

    const jobs = await queue.addBulk([
      { name, data: { idx: 0, foo: 'bar' }, opts: { jobId: 'test1' } },
      { name, data: { idx: 1, foo: 'baz' }, opts: { jobId: 'test2' } },
    ])
    expect(jobs).to.have.length(2)

    expect(jobs[0].id).toBe('test1')
    expect(jobs[0].data.foo).toBe('bar')
    expect(jobs[1].id).toBe('test2')
    expect(jobs[1].data.foo).toBe('baz')

    await processing
    await worker.close()
  })
})
