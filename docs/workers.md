---
title: Workers
description: Learn how to process jobs with workers and handle concurrency.
---
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
