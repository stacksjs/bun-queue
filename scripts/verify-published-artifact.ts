#!/usr/bin/env bun

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

interface PackedFile { path: string }
interface PackReport { files?: PackedFile[] }

const pack = Bun.spawnSync([
  'npm',
  'pack',
  '--dry-run',
  '--json',
  '--workspace',
  'packages/bun-queue',
], {
  cwd: resolve(import.meta.dir, '..'),
  stdout: 'pipe',
  stderr: 'pipe',
})
if (!pack.success)
  throw new Error(`npm pack verification failed: ${pack.stderr.toString()}`)

const reports = JSON.parse(pack.stdout.toString()) as PackReport[]
const packedFiles = new Set(reports[0]?.files?.map(file => file.path) || [])
if (!packedFiles.has('dist/commands/addStandardJob-8.lua') || !packedFiles.has('dist/commands/includes/storeJob.lua'))
  throw new Error('Publishable npm tarball is missing Redis command assets')

const commandDir = resolve(import.meta.dir, '../packages/bun-queue/dist/commands')
if (!existsSync(resolve(commandDir, 'addStandardJob-8.lua')) || !existsSync(resolve(commandDir, 'includes/storeJob.lua')))
  throw new Error('Published dist is missing Redis command assets')

const artifactUrl = new URL('../packages/bun-queue/dist/index.js', import.meta.url).href
const { Queue } = await import(artifactUrl)
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
  console.log(`Publishable npm artifact includes ${packedFiles.size} files, loaded ${commandDir}, and passed a live Redis round trip`)
}
finally {
  await queue.empty()
  await queue.close()
}
