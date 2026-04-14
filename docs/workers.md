---
title: Workers
description: Learn how to process jobs with workers and handle concurrency.
---

- **Fixed**: Always waits the same delay between retries
- **Exponential**: Delay doubles with each retry (1s, 2s, 4s, 8s, ...)

## Worker with Distributed Lock

Jobs are processed with distributed locks to prevent race conditions:

```typescript
const queue = new Queue('tasks', {
  distributedLock: true // Enabled by default
})

queue.process(5, async (job) => {
  // This job is locked - no other worker can process it
  await performCriticalOperation(job.data)
  return { success: true }
})
```

## Pausing and Resuming

Control job processing:

```typescript
// Pause the queue - no new jobs will be processed
await queue.pause()

// Resume processing
await queue.resume()
```

## Graceful Shutdown

Stop processing gracefully:

```typescript
// Close the queue and wait for active jobs
await queue.close()
```

## Processing Job Classes

Use class-based jobs for better organization:

```typescript
import { Queue, JobContract } from 'bun-queue'

// Define a job class
class SendWelcomeEmailJob implements JobContract {
  delay = 0
  tries = 3
  timeout = 30000
  backoff = [1000, 2000, 4000]

  constructor(
    public userId: number,
    public email: string
  ) {}

  async handle() {
    await sendWelcomeEmail(this.email)
  }

  uniqueId() {
    return `welcome-email-${this.userId}`
  }
}

// Dispatch the job
await queue.dispatchJob(new SendWelcomeEmailJob(123, 'user@example.com'))

// Process job classes
queue.processJobs(5)
```

## Event Listeners

Listen to worker events:

```typescript
queue.events.on('jobActive', (jobId) => {
  console.log(`Job ${jobId} started processing`)
})

queue.events.on('jobCompleted', (jobId, result) => {
  console.log(`Job ${jobId} completed:`, result)
})

queue.events.on('jobFailed', (jobId, error) => {
  console.error(`Job ${jobId} failed:`, error)
})

queue.events.on('jobStalled', (jobId) => {
  console.warn(`Job ${jobId} stalled`)
})
```

## Worker Timeout

Set job timeout:

```typescript
await queue.add(data, {
  timeout: 60000 // 60 second timeout
})
```

If a job exceeds its timeout, it will be marked as failed.

## Multiple Workers

Run multiple workers for the same queue:

```typescript
// worker1.ts
const queue1 = new Queue('tasks')
queue1.process(5, handler)

// worker2.ts
const queue2 = new Queue('tasks')
queue2.process(5, handler)
```

Both workers will compete for jobs from the same queue.

## Horizontal Scaling

Enable horizontal scaling for distributed workers:

```typescript
const queue = new Queue('tasks', {
  horizontalScaling: {
    enabled: true,
    instanceId: process.env.INSTANCE_ID,
    maxWorkersPerInstance: 10,
    jobsPerWorker: 5
  }
})

queue.process(5, async (job) => {
  // Work is automatically coordinated across instances
  return await processJob(job.data)
})
```
