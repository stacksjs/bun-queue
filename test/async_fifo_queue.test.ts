import { describe, expect, it } from 'bun:test'
import { AsyncFifoQueue } from '../src/classes/async-fifo-queue'

describe('AsyncFIFOQueue', () => {
  it('empty queue', async () => {
    const asyncFifoQueue = new AsyncFifoQueue<number>()

    expect(asyncFifoQueue.numPending()).toBe(0)
    expect(asyncFifoQueue.numQueued()).toBe(0)
    expect(asyncFifoQueue.numTotal()).toBe(0)

    const result = await asyncFifoQueue.fetch()
    expect(result).toBe(undefined)
  })

  it('handles a promise that rejects', async () => {
    const asyncFifoQueue = new AsyncFifoQueue<number>()

    asyncFifoQueue.add(
      new Promise<number>((resolve, reject) => {
        setTimeout(() => reject(new Error('test')), 10)
      }),
    )

    asyncFifoQueue.add(
      new Promise<number>((resolve, _reject) => {
        setTimeout(() => resolve(42), 100)
      }),
    )

    const result = await asyncFifoQueue.fetch()
    expect(result).toBe(42)
  })

  it('add several promises and wait for them to complete', async () => {
    const asyncFifoQueue = new AsyncFifoQueue<number>()
    const promises = [1, 2, 3, 4, 5].map(
      i =>
        new Promise<number>((resolve) => {
          setTimeout(() => resolve(i), i * 100)
        }),
    )
    promises.forEach(p => asyncFifoQueue.add(p))

    expect(asyncFifoQueue.numPending()).toBe(promises.length)
    expect(asyncFifoQueue.numQueued()).toBe(0)
    expect(asyncFifoQueue.numTotal()).toBe(promises.length)

    await asyncFifoQueue.waitAll()
    expect(asyncFifoQueue.numPending()).toBe(0)
    expect(asyncFifoQueue.numQueued()).toBe(promises.length)
    expect(asyncFifoQueue.numTotal()).toBe(promises.length)
  })

  it('add several promises and wait for them to complete in order', async () => {
    const asyncFifoQueue = new AsyncFifoQueue<number>()
    const promises = [1, 2, 3, 4, 5].map(
      i =>
        new Promise<number>((resolve) => {
          setTimeout(() => resolve(i), i * 100)
        }),
    )
    promises.forEach(p => asyncFifoQueue.add(p))

    expect(asyncFifoQueue.numPending()).toBe(promises.length)
    expect(asyncFifoQueue.numQueued()).toBe(0)
    expect(asyncFifoQueue.numTotal()).toBe(promises.length)

    const results: number[] = []
    for (let i = 0; i < promises.length; i++) {
      results.push((await asyncFifoQueue.fetch())!)
    }

    expect(results).toBe([1, 2, 3, 4, 5])
  })

  it('add several promises with random delays and wait for them to complete in order', async () => {
    const asyncFifoQueue = new AsyncFifoQueue<number>()

    const randomDelays = [250, 100, 570, 50, 400, 10, 300, 125, 460, 200]

    const promises = randomDelays.map(
      i =>
        new Promise<number>((resolve) => {
          setTimeout(() => resolve(i), i)
        }),
    )
    promises.forEach(p => asyncFifoQueue.add(p))

    expect(asyncFifoQueue.numPending()).toBe(promises.length)
    expect(asyncFifoQueue.numQueued()).toBe(0)
    expect(asyncFifoQueue.numTotal()).toBe(promises.length)

    const results: number[] = []
    for (let i = 0; i < promises.length; i++) {
      results.push((await asyncFifoQueue.fetch())!)
    }

    expect(results).toBe(randomDelays.sort((a, b) => a - b))
  })

  it('add several promises while fetching them concurrently', async () => {
    const asyncFifoQueue = new AsyncFifoQueue<number>()

    const randomDelays = [
      250,
      100,
      570,
      50,
      400,
      10,
      300,
      125,
      460,
      200,
      60,
      100,
    ]
    const results: number[] = []
    const concurrency = 3

    for (let i = 0; i < randomDelays.length; i++) {
      const delay = randomDelays[i]
      asyncFifoQueue.add(
        new Promise<number>((resolve) => {
          setTimeout(() => resolve(delay), delay)
        }),
      )

      if ((i + 1) % concurrency === 0) {
        for (let j = 0; j < concurrency; j++) {
          results.push((await asyncFifoQueue.fetch())!)
        }
      }
    }

    const expected = [100, 250, 570, 10, 50, 400, 125, 300, 460, 60, 100, 200]

    expect(results).toBe(expected)
  })

  it('should handle promises that get rejected and don\'t block the queue', async () => {
    const asyncFifoQueue = new AsyncFifoQueue<number>(true)

    const randomDelays = [250, 100, 570, 50, 400, 10, 300, 125, 460, 200]

    for (let i = 0; i < randomDelays.length; i++) {
      asyncFifoQueue.add(
        new Promise<number>((resolve, reject) => {
          setTimeout(() => reject(new Error(`${randomDelays[i]}`)), i)
        }),
      )
    }

    const results: number[] = []
    for (let i = 0; i < randomDelays.length; i++) {
      results.push((await asyncFifoQueue.fetch())!)
    }

    expect(results).toBe(randomDelays.map(() => void 0))
  })
})
