---
title: Workers
description: Learn how to process jobs with workers and handle concurrency.
---

# Workers

Workers are responsible for processing jobs from the queue. They pick up jobs and execute your handler function.

## Basic Worker

Start processing jobs by calling the `process` method:

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('emails')

// Process jobs with concurrency of 5
queue.process(5, async (job) => {
  const { to, subject, body } = job.data

  // Process the job
  await sendEmail(to, subject, body)

  // Return a result (optional)
  return { sent: true, timestamp: Date.now() }
})
```

## Concurrency Control

The first argument to `process` is the concurrency level:

```typescript
// Process 1 job at a time
queue.process(1, handler)

// Process up to 10 jobs concurrently
queue.process(10, handler)
```

## Job Progress Updates

Update job progress during processing:

```typescript
queue.process(5, async (job) => {
  const items = job.data.items

  await job.updateProgress(0)

  for (let i = 0; i < items.length; i++) {
    await processItem(items[i])
    await job.updateProgress(Math.round((i + 1) / items.length * 100))
  }

  await job.updateProgress(100)

  return { processed: items.length }
})
```

## Accessing Job Properties

Jobs provide access to various properties:

```typescript
queue.process(5, async (job) => {
  console.log('Job ID:', job.id)
  console.log('Job data:', job.data)
  console.log('Attempts made:', job.attemptsMade)
  console.log('Options:', job.opts)
  console.log('Timestamp:', job.timestamp)
  console.log('Progress:', job.progress)

  // Check if job has dependencies
  if (job.dependencies && job.dependencies.length > 0) {
    console.log('Dependencies:', job.dependencies)
  }

  return { success: true }
})
```

## Handling Errors

Throw errors to mark jobs as failed:

```typescript
queue.process(5, async (job) => {
  if (!job.data.email) {
    throw new Error('Email is required')
  }

  try {
    await sendEmail(job.data.email, job.data.subject, job.data.body)
  } catch (error) {
    // Re-throw to mark job as failed
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return { sent: true }
})
```

## Retry Configuration

Configure retries via job options:

```typescript
// When adding the job
await queue.add(data, {
  attempts: 5,              // Retry up to 5 times
  backoff: {
    type: 'exponential',    // 'fixed' or 'exponential'
    delay: 1000             // Base delay in ms
  }
})
```

Retry behavior:
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
