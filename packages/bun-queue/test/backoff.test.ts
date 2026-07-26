import { describe, expect, test } from 'bun:test'
import { backoffDelay } from '../src/utils'

describe('backoffDelay', () => {
  test('returns no delay when backoff is unset', () => {
    expect(backoffDelay(undefined, 1)).toBe(0)
  })

  test('fixed backoff waits the same delay on every attempt', () => {
    const backoff = { type: 'fixed', delay: 5000 } as const

    expect(backoffDelay(backoff, 1)).toBe(5000)
    expect(backoffDelay(backoff, 2)).toBe(5000)
    expect(backoffDelay(backoff, 9)).toBe(5000)
  })

  test('exponential backoff doubles from the base delay', () => {
    const backoff = { type: 'exponential', delay: 1000 } as const

    expect(backoffDelay(backoff, 1)).toBe(1000)
    expect(backoffDelay(backoff, 2)).toBe(2000)
    expect(backoffDelay(backoff, 3)).toBe(4000)
    expect(backoffDelay(backoff, 4)).toBe(8000)
  })

  test('an array is an explicit per-attempt schedule in milliseconds', () => {
    const backoff = [1000, 5000, 30000]

    expect(backoffDelay(backoff, 1)).toBe(1000)
    expect(backoffDelay(backoff, 2)).toBe(5000)
    expect(backoffDelay(backoff, 3)).toBe(30000)
  })

  test('an exhausted schedule clamps to its last entry', () => {
    expect(backoffDelay([1000, 5000], 3)).toBe(5000)
    expect(backoffDelay([1000, 5000], 100)).toBe(5000)
  })

  test('an empty schedule retries immediately', () => {
    expect(backoffDelay([], 1)).toBe(0)
  })

  test('a zero or negative attempt count reads the first entry', () => {
    expect(backoffDelay([1000, 5000], 0)).toBe(1000)
    expect(backoffDelay({ type: 'exponential', delay: 1000 }, 0)).toBe(1000)
  })
})
