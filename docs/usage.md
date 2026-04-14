---
title: Usage
description: Learn how to use bun-queue to create, process, and manage jobs.
---

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
