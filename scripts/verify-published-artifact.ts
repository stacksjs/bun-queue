#!/usr/bin/env bun

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const commandDir = resolve(import.meta.dir, '../dist/commands')
if (!existsSync(resolve(commandDir, 'addStandardJob-8.lua')) || !existsSync(resolve(commandDir, 'includes/storeJob.lua')))
  throw new Error('Published dist is missing Redis command assets')

const { Queue } = await import('../dist/index.js')
const queue = new Queue(`published-contract-${process.pid}`, {
  driver: 'redis',
  redis: { url: process.env.REDIS_URL || 'redis://127.0.0.1:6379/0' },
})

try {
  if (!await queue.ping()) throw new Error('Published queue could not ping Redis')
  await queue.empty()
  const job = await queue.add({ artifact: 'published-dist' })
  const stored = await queue.getJob(job.id)
  if (stored?.data?.artifact !== 'published-dist') throw new Error('Published queue could not round-trip a job')
  await queue.removeJob(job.id)
  if (await queue.getJob(job.id)) throw new Error('Published queue could not remove a job')
  console.log(`Published queue artifact loaded ${commandDir} and passed a live Redis round trip`)
}
finally {
  await queue.empty()
  await queue.close()
}
