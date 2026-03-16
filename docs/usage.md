---
title: Usage
description: Learn how to use bun-queue to create, process, and manage jobs.
---

# Usage

## Quick Start

```typescript
import { Queue } from '@stacksjs/bun-queue'

// Create a queue
const queue = new Queue('emails')

// Add a job
const job = await queue.add({
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for signing up.',
})

// Process jobs (concurrency of 3)
queue.process(3, async (job) => {
  await sendEmail(job.data.to, job.data.subject, job.data.body)
  return { sent: true }
})
```

## Adding Jobs

```typescript
// Simple job
const job = await queue.add({ task: 'resize', width: 800 })

// With options
const job = await queue.add(data, {
  delay: 5000,             // delay 5 seconds
  attempts: 3,             // retry up to 3 times
  priority: 10,            // higher = processed first
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: true,
  timeout: 30000,
  jobId: 'unique-id',      // custom ID, prevents duplicates
})
```

## Processing Jobs

```typescript
// Basic processing
queue.process(5, async (job) => {
  console.log('Processing:', job.id, job.data)
  await job.updateProgress(50)
  // ... do work ...
  await job.updateProgress(100)
  return { result: 'done' }
})
```

Throwing an error inside the handler marks the job as failed. If `attempts > 1`, it will be retried.

## Job Dependencies

Chain jobs so they run in order:

```typescript
const fetchJob = await queue.add({ step: 'fetch-data' })
const transformJob = await queue.add(
  { step: 'transform' },
  { dependsOn: fetchJob.id },
)
const loadJob = await queue.add(
  { step: 'load' },
  { dependsOn: [fetchJob.id, transformJob.id] },
)
```

## Events

```typescript
queue.events.on('jobCompleted', (jobId, result) => {
  console.log(`Job ${jobId} done:`, result)
})

queue.events.on('jobFailed', (jobId, error) => {
  console.error(`Job ${jobId} failed:`, error.message)
})

queue.events.on('jobProgress', (jobId, progress) => {
  console.log(`Job ${jobId}: ${progress}%`)
})

queue.events.on('jobStalled', (jobId) => {
  console.warn(`Job ${jobId} stalled`)
})
```

## Querying Jobs

```typescript
// Single job
const job = await queue.getJob('job-id')

// By status
const waiting = await queue.getJobs('waiting')
const active = await queue.getJobs('active')
const failed = await queue.getJobs('failed')

// Counts
const counts = await queue.getJobCounts()
// { waiting: 5, active: 2, completed: 10, failed: 1, delayed: 3, paused: 0 }
```

## Queue Controls

```typescript
await queue.pause()    // pause processing
await queue.resume()   // resume processing
await queue.empty()    // remove all jobs
await queue.close()    // graceful shutdown

// Health check
const ok = await queue.ping() // true if Redis connected

// Bulk operations
await queue.bulkRemove(['job-1', 'job-2'])
```

## Job Classes

For more structured jobs, use class-based dispatch:

```typescript
import { JobBase } from '@stacksjs/bun-queue'

class SendWelcomeEmail extends JobBase {
  tries = 3
  timeout = 30000
  backoff = [1000, 2000, 4000]

  constructor(public email: string) {
    super()
  }

  async handle() {
    await sendEmail(this.email)
  }

  uniqueId() {
    return `welcome-${this.email}`
  }
}

// Dispatch
await queue.dispatchJob(new SendWelcomeEmail('user@example.com'))

// Process class-based jobs
queue.processJobs(5)
```

## Dispatch Helpers

```typescript
import { dispatch, dispatchAfter, dispatchIf, chain, batch } from '@stacksjs/bun-queue'

// Basic dispatch
await dispatch(new SendEmailJob('user@example.com'))

// Conditional
await dispatchIf(user.isVerified, new SendEmailJob(user.email))

// Delayed
await dispatchAfter(5000, new SendEmailJob(user.email))

// Fluent chain
await chain(new SendEmailJob(user.email))
  .onQueue('emails')
  .withTries(5)
  .delay(1000)
  .dispatch()

// Batch
const result = await batch('welcome-batch')
  .add(new SendEmailJob('a@example.com'))
  .add(new SendEmailJob('b@example.com'))
  .allowFailures()
  .dispatch()
```

## Rate Limiting

```typescript
const queue = new Queue('api-calls', {
  limiter: {
    max: 100,
    duration: 60000, // 100 requests per minute
  },
})

// Per-key rate limiting
const queue = new Queue('api-calls', {
  limiter: {
    max: 10,
    duration: 1000,
    keyPrefix: (data) => `user:${data.userId}`,
  },
})

// Manual check
const { limited, remaining, resetIn } = await queue.isRateLimited()
```

## Distributed Locks

```typescript
const queue = new Queue('tasks', { distributedLock: true })
const lock = queue.getLock()

// Manual lock usage
const token = await lock.acquire('my-resource', { duration: 5000 })
if (token) {
  try {
    // ... critical section ...
  } finally {
    await lock.release('my-resource', token)
  }
}

// Or use the helper
await lock.withLock('my-resource', async () => {
  // ... automatically locked and released ...
})
```

## Queue Manager

Manage multiple queues and connections:

```typescript
import { getQueueManager } from '@stacksjs/bun-queue'

const manager = getQueueManager({
  default: 'redis',
  connections: {
    redis: {
      driver: 'redis',
      redis: { url: 'redis://localhost:6379' },
    },
  },
})

const emailQueue = manager.queue('emails')
const taskQueue = manager.queue('tasks')

// Cleanup
await manager.closeAll()
```

## Next Steps

- [Configuration](/configuration) — Full configuration reference
- [Priority Queues](/priority-queues) — Process jobs by importance
- [Cron Jobs](/cron-jobs) — Schedule recurring jobs
- [Dead Letter Queues](/dead-letter-queues) — Handle permanently failed jobs
- [Failed Jobs](/failed-jobs) — Retry strategies and error handling
