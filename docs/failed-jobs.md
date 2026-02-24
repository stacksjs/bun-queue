---
title: Failed Job Handling
description: Learn how to handle, retry, and manage failed jobs.
---

# Failed Job Handling

bun-queue provides comprehensive tools for handling and managing failed jobs.

## Retry Configuration

Configure automatic retries when adding jobs:

```typescript
await queue.add(data, {
  attempts: 5,              // Maximum retry attempts
  backoff: {
    type: 'exponential',    // 'fixed' or 'exponential'
    delay: 1000             // Base delay in milliseconds
  }
})
```

### Backoff Strategies

**Fixed Backoff:**
```typescript
{
  backoff: {
    type: 'fixed',
    delay: 5000  // Always wait 5 seconds between retries
  }
}
```

**Exponential Backoff:**
```typescript
{
  backoff: {
    type: 'exponential',
    delay: 1000  // 1s, 2s, 4s, 8s, 16s...
  }
}
```

## Accessing Failed Jobs

Get all failed jobs:

```typescript
const failedJobs = await queue.getJobs('failed')

for (const job of failedJobs) {
  console.log('Job ID:', job.id)
  console.log('Failed reason:', job.failedReason)
  console.log('Attempts made:', job.attemptsMade)
  console.log('Stacktrace:', job.stacktrace)
}
```

## Retrying Failed Jobs

Manually retry a failed job:

```typescript
const job = await queue.getJob('failed-job-id')

if (job) {
  await job.retry()
  console.log('Job retried')
}
```

Retry with new arguments:

```typescript
await queue.retryJob('failed-job-id', { newData: 'updated' })
```

## Failed Job Manager

Use the FailedJobManager for advanced failed job management:

```typescript
import { FailedJobManager } from 'bun-queue'

const failedJobManager = new FailedJobManager('redis', {
  prefix: 'myapp'
})

// Get all failed jobs
const allFailed = await failedJobManager.all()

// Find a specific failed job
const failedJob = await failedJobManager.find('job-id')

// Retry a failed job
await failedJobManager.retry('job-id')

// Retry all failed jobs
const retriedCount = await failedJobManager.retryAll()

// Forget (delete) a failed job
await failedJobManager.forget('job-id')

// Flush all failed jobs
await failedJobManager.flush()

// Prune old failed jobs (default: older than 7 days)
const prunedCount = await failedJobManager.prune(168) // hours

// Get count of failed jobs
const count = await failedJobManager.count()
```

## Filter Failed Jobs

Filter by queue or connection:

```typescript
// Get failed jobs for a specific queue
const emailFailures = await failedJobManager.getFailedJobsByQueue('emails')

// Get failed jobs for a specific connection
const redisFailures = await failedJobManager.getFailedJobsByConnection('redis')
```

## Failed Job Events

Listen for failed job events:

```typescript
queue.events.on('jobFailed', (jobId, error) => {
  console.error(`Job ${jobId} failed:`, error.message)

  // Log to external service
  logToSentry(error, { jobId })
})
```

## Error Handling in Workers

Handle errors gracefully in your worker:

```typescript
queue.process(5, async (job) => {
  try {
    await riskyOperation(job.data)
  } catch (error) {
    // Log the error
    console.error('Job failed:', error)

    // Optionally add context before re-throwing
    error.jobId = job.id
    error.jobData = job.data

    throw error  // Job will be marked as failed
  }
})
```

## Custom Failure Handling

Implement custom failure handling:

```typescript
queue.process(5, async (job) => {
  try {
    return await processJob(job.data)
  } catch (error) {
    // Check if this is the last attempt
    const maxAttempts = job.opts.attempts || 1
    const isLastAttempt = job.attemptsMade >= maxAttempts - 1

    if (isLastAttempt) {
      // Notify admins on final failure
      await notifyAdmins({
        jobId: job.id,
        error: error.message,
        attempts: job.attemptsMade + 1
      })
    }

    throw error
  }
})
```

## Job Stacktrace

Access the full error history:

```typescript
const job = await queue.getJob('job-id')

if (job && job.stacktrace) {
  // stacktrace contains last 10 error traces
  job.stacktrace.forEach((trace, index) => {
    console.log(`Attempt ${index + 1}:`, trace)
  })
}
```

## Remove Failed Jobs

Clean up failed jobs:

```typescript
// Remove a specific failed job
const job = await queue.getJob('failed-job-id')
await job.remove()

// Bulk remove failed jobs
const failedJobs = await queue.getJobs('failed')
const jobIds = failedJobs.map(job => job.id)
await queue.bulkRemove(jobIds)
```

## Failed Job Statistics

Get statistics about failed jobs:

```typescript
// Get job counts
const counts = await queue.getJobCounts()
console.log('Failed jobs:', counts.failed)

// Get failed job class statistics
const stats = await queue.getFailedJobClasses()

for (const failure of stats) {
  console.log('Job class:', failure.jobClass)
  console.log('Error:', failure.error)
  console.log('Failed at:', new Date(failure.failedAt))
}
```

## Move to Dead Letter Queue

Configure automatic movement to dead letter queue:

```typescript
await queue.add(data, {
  attempts: 3,
  deadLetter: true  // Move to DLQ after all attempts exhausted
})

// Or with custom options
await queue.add(data, {
  deadLetter: {
    enabled: true,
    maxRetries: 5,
    queueSuffix: '-dlq'
  }
})
```

See [Dead Letter Queues](/dead-letter-queues) for more details.
