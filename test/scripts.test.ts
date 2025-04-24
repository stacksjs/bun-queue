import { expect } from 'chai'
import { default as IORedis } from 'ioredis'
import { after as afterAll, before, beforeEach, describe, it } from 'mocha'
import { v4 } from 'uuid'
import { Queue } from '../src/classes'
import { removeAllQueueData } from '../src/utils'

describe('scripts', () => {
  const redisHost = process.env.REDIS_HOST || 'localhost'
  const prefix = process.env.BULLMQ_TEST_PREFIX || 'bull'

  let queue: Queue
  let queueName: string

  let connection
  before(async () => {
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

  describe('.paginateSet', () => {
    const testSet = 'test-set'

    beforeEach(async () => {
      const client = await queue.client
      await client.del(testSet)
    })

    it('should paginate a small set same size as set', async () => {
      const scripts = queue.scripts

      const client = await queue.client
      await client.sadd(
        testSet,
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
      )

      const page = await scripts.paginate(testSet, { start: 0, end: 9 })

      page.items = page.items.sort((a, b) => a.id.localeCompare(b.id))

      expect(page).toBe({
        items: [
          { id: 'a' },
          { id: 'b' },
          { id: 'c' },
          { id: 'd' },
          { id: 'e' },
          { id: 'f' },
          { id: 'g' },
          { id: 'h' },
          { id: 'i' },
          { id: 'j' },
        ],
        jobs: [],
        cursor: '0',
        total: 10,
      })
    })

    it('should paginate a small set different size as set', async () => {
      const scripts = queue.scripts

      const members = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

      const client = await queue.client
      await client.sadd(testSet, ...members)

      const page = await scripts.paginate(testSet, { start: 3, end: 7 })

      expect(page.items).toHaveLength(5)
      expect(page.cursor).toBe('0')
      expect(page.total).toBe(members.length)
    })

    it('should paginate a large set in pages of given size', async () => {
      const scripts = queue.scripts

      const client = await queue.client

      const pageSize = 13
      const numPages = 1

      const totalItems = pageSize * numPages

      const items = Array.from({ length: totalItems })
        .fill(0)
        .map((_, i) => i)

      await client.sadd(testSet, ...items)

      const pagedItems: { id: string }[] = []
      for (let i = 0; i < numPages; i++) {
        const start = i * pageSize
        const end = start + pageSize - 1
        const page = await scripts.paginate(testSet, { start, end })
        expect(page.items).toHaveLength(pageSize)
        expect(page.total).toBe(totalItems)
        pagedItems.push(...page.items)
      }

      const sortedItems = pagedItems
        .map(i => ({ id: Number.parseInt(i.id) }))
        .sort((a, b) => a.id - b.id)

      expect(sortedItems).toBe(items.map(i => ({ id: i })))
    })
  })

  describe('.paginateHash', () => {
    const testHash = 'test-hash'

    beforeEach(async () => {
      const client = await queue.client
      await client.del(testHash)
    })

    it('should paginate a small hash same size as hash', async () => {
      const scripts = queue.scripts

      const client = await queue.client
      await client.hmset(testHash, {
        a: JSON.stringify('a'),
        b: JSON.stringify('b'),
        c: JSON.stringify('c'),
        d: JSON.stringify('d'),
        e: JSON.stringify('e'),
        f: JSON.stringify('f'),
        g: JSON.stringify('g'),
        h: JSON.stringify('h'),
        i: JSON.stringify('i'),
        j: JSON.stringify('j'),
      })

      const page = await scripts.paginate(testHash, { start: 0, end: 9 })

      expect(page).toBe({
        items: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map(key => ({
          id: key,
          v: key,
        })),
        jobs: [],
        cursor: '0',
        total: 10,
      })
    })

    it('should paginate a small hash different size as hash', async () => {
      const scripts = queue.scripts

      const client = await queue.client
      await client.hmset(testHash, {
        a: JSON.stringify('a'),
        b: JSON.stringify('b'),
        c: JSON.stringify('c'),
        d: JSON.stringify('d'),
        e: JSON.stringify('e'),
        f: JSON.stringify('f'),
        g: JSON.stringify('g'),
        h: JSON.stringify('h'),
        i: JSON.stringify('i'),
        j: JSON.stringify('j'),
      })

      const page = await scripts.paginate(testHash, { start: 3, end: 7 })

      expect(page.items).toHaveLength(5)

      expect(page.items).toBe(
        ['d', 'e', 'f', 'g', 'h'].map(key => ({ id: key, v: key })),
      )

      expect(page).toBe({
        items: ['d', 'e', 'f', 'g', 'h'].map(key => ({ id: key, v: key })),
        jobs: [],
        cursor: '0',
        total: 10,
      })
    })

    it('should paginate a large hash in pages of given size', async () => {
      const scripts = queue.scripts

      const client = await queue.client

      const pageSize = 13
      const numPages = 137

      const totalItems = pageSize * numPages

      const items = Array.from({ length: totalItems })
        .fill(0)
        .map((_, i) => ({ [i]: i }))
        .reduce((acc, item) => {
          const key = Object.keys(item)[0]
          acc[key] = item[key]
          return acc
        })

      await client.hmset(testHash, items)

      const pagedItems: any[] = []
      for (let i = 0; i < numPages; i++) {
        const start = i * pageSize
        const end = start + pageSize - 1

        const page = await scripts.paginate(testHash, { start, end })
        expect(page.items).toHaveLength(pageSize)
        expect(page.total).toBe(totalItems)
        pagedItems.push(...page.items)
      }

      const itemsObject = pagedItems.reduce((acc, item) => {
        acc = { ...acc, [item.id]: item.v }
        return acc
      }, {})

      for (const key of Object.keys(itemsObject)) {
        itemsObject[key] = Number.parseInt(itemsObject[key])
      }

      expect(itemsObject).toBe(items)
    })
  })
})
