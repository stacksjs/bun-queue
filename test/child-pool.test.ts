import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import { ChildPool } from '../src/classes'

describe('child pool for Child Processes', () => {
  sandboxProcessTests()
})

describe('child pool for Worker Threads', () => {
  sandboxProcessTests({
    mainFile: join(process.cwd(), 'dist/cjs/classes/main-worker.js'),
    useWorkerThreads: true,
  })
})

function sandboxProcessTests(
  {
    mainFile,
    useWorkerThreads,
  }: { mainFile?: string, useWorkerThreads?: boolean } = {
    useWorkerThreads: false,
  },
) {
  describe('child pool', () => {
    let pool: ChildPool

    beforeEach(() => {
      pool = new ChildPool({ mainFile, useWorkerThreads })
    })

    afterEach(() => pool.clean())

    it('should return same child if free', async () => {
      const processor = join(__dirname, 'fixtures/fixture_processor_bar.js')
      const child = await pool.retain(processor)
      expect(child).toBeTruthy()
      pool.release(child)
      expect(pool.retained).toEqual({})
      const newChild = await pool.retain(processor)
      expect(child).toBe(newChild)
    })

    it('should return a new child if reused the last free one', async () => {
      const processor = join(__dirname, 'fixtures/fixture_processor_bar.js')
      let child = await pool.retain(processor)
      expect(child).toBeTruthy()
      pool.release(child)
      expect(pool.retained).toEqual({})
      let newChild = await pool.retain(processor)
      expect(child).toBe(newChild)
      child = newChild
      newChild = await pool.retain(processor)
      expect(child).not.toBe(newChild)
    })

    it('should return a new child if none free', async () => {
      const processor = join(__dirname, 'fixtures/fixture_processor_bar.js')
      const child = await pool.retain(processor)
      expect(child).toBeTruthy()
      expect(pool.retained).not.toEqual({})
      const newChild = await pool.retain(processor)
      expect(child).not.toEqual(newChild)
    })

    it('should return a new child if killed', async () => {
      const processor = join(__dirname, 'fixtures/fixture_processor_bar.js')
      const child = await pool.retain(processor)
      expect(child).toBeTruthy()
      await pool.kill(child)
      expect(pool.retained).toEqual({})
      const newChild = await pool.retain(processor)
      expect(child).not.toEqual(newChild)
    })

    it('should return a new child if many retained and none free', async () => {
      const processor = join(__dirname, 'fixtures/fixture_processor_bar.js')
      const children = await Promise.all([
        pool.retain(processor),
        pool.retain(processor),
        pool.retain(processor),
        pool.retain(processor),
        pool.retain(processor),
        pool.retain(processor),
      ])
      expect(children).toHaveLength(6)
      const child = await pool.retain(processor)
      expect(children).not.toContain(child)
    }, 10000)

    it('should return an old child if many retained and one free', async () => {
      const processor = join(__dirname, 'fixtures/fixture_processor_bar.js')
      const children = await Promise.all([
        pool.retain(processor),
        pool.retain(processor),
        pool.retain(processor),
        pool.retain(processor),
        pool.retain(processor),
        pool.retain(processor),
      ])

      expect(children).toHaveLength(6)
      pool.release(children[0])
      const child = await pool.retain(processor)
      expect(children).toContain(child)
    }, 10000)

    it('should consume execArgv array from process', async () => {
      const processor = join(__dirname, 'fixtures/fixture_processor_bar.js')
      process.execArgv.push('--no-warnings')

      const child = await pool.retain(processor)
      expect(child).toBeTruthy()
      if (!useWorkerThreads) {
        expect(child.childProcess.spawnargs).toContain('--no-warnings')
      }
    })
  })
}
