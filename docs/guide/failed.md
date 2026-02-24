---
title: Failed Job Handling
description: Handle failed jobs, retries, and dead letter queues in bun-queue
---

# Failed Job Handling

This guide covers handling failed jobs, configuring retries, and using dead letter queues for permanently failed jobs.

## Job Failure Basics

When a job throws an error or times out, it's marked as failed:

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('tasks')

queue.process(5, async (job) => {
  if (!job.data.valid) {
    throw new Error('Invalid job data')
  }

  // If this throws, job is marked as failed
  return await riskyOperation(job.data)
})
```

## Retry Configuration

### Basic Retries

```typescript
// Retry up to 3 times with no delay
await queue.add(
  { task: 'send-email' },
  {
    attempts: 3,
  }
)
```

### Fixed Backoff

Retry with a constant delay between attempts:

```typescript
await queue.add(
  { task: 'api-call' },
  {
    attempts: 5,
    backoff: {
      type: 'fixed',
      delay: 5000, // Wait 5 seconds between each retry
    },
  }
)
// Retry times: 5s, 5s, 5s, 5s
```

### Exponential Backoff

Retry with increasing delays:

```typescript
await queue.add(
  { task: 'api-call' },
  {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000, // Base delay of 1 second
    },
  }
)
// Retry times: 1s, 2s, 4s, 8s (exponential growth)
```

### Default Retry Configuration

Set defaults for all jobs in a queue:

```typescript
const queue = new Queue('tasks', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
})
```

## Monitoring Failed Jobs

### Get Failed Jobs

```typescript
// Get all failed jobs
const failedJobs = await queue.getJobs('failed')

for (const job of failedJobs) {
  console.log('Failed job:', job.id)
  console.log('Data:', job.data)
  console.log('Reason:', job.failedReason)
  console.log('Attempts:', job.attemptsMade)
  console.log('Stacktrace:', job.stacktrace)
}
```

### Get Job Counts

```typescript
const counts = await queue.getJobCounts()
console.log('Failed jobs:', counts.failed)
console.log('Waiting jobs:', counts.waiting)
console.log('Active jobs:', counts.active)
```

### Listen to Failure Events

```typescript
queue.on('jobFailed', (jobId, error) => {
  console.error(`Job ${jobId} failed:`, error.message)

  // Alert, log, or take action
  alerting.notify({
    title: 'Job Failed',
    message: error.message,
    jobId,
  })
})
```

## Retrying Failed Jobs

### Manual Retry

```typescript
// Get a specific failed job
const job = await queue.getJob('failed-job-id')

if (job) {
  // Retry the job (puts it back in waiting queue)
  await job.retry()
  console.log(`Job ${job.id} queued for retry`)
}
```

### Retry All Failed Jobs

```typescript
async function retryAllFailed(queue: Queue) {
  const failedJobs = await queue.getJobs('failed')

  console.log(`Retrying ${failedJobs.length} failed jobs`)

  for (const job of failedJobs) {
    await job.retry()
  }
}
```

### Conditional Retry

```typescript
async function retryRecoverable(queue: Queue) {
  const failedJobs = await queue.getJobs('failed')

  for (const job of failedJobs) {
    // Only retry certain errors
    if (job.failedReason?.includes('timeout') ||
        job.failedReason?.includes('network')) {
      await job.retry()
      console.log(`Retrying job ${job.id} - recoverable error`)
    } else {
      console.log(`Skipping job ${job.id} - unrecoverable error`)
    }
  }
}
```

## Dead Letter Queue

For jobs that fail after all retry attempts, use a dead letter queue:

### Enable Dead Letter Queue

```typescript
const queue = new Queue('tasks', {
  defaultDeadLetterOptions: {
    enabled: true,
    maxRetries: 3,
    queueSuffix: '-dead-letter',
    removeFromOriginalQueue: true,
  },
})
```

### Per-Job Dead Letter Configuration

```typescript
await queue.add(
  { task: 'critical-operation' },
  {
    attempts: 5,
    deadLetter: {
      enabled: true,
      maxRetries: 5,
    },
  }
)
```

### Using DeadLetterQueue Directly

```typescript
import { Queue, DeadLetterQueue } from 'bun-queue'

const mainQueue = new Queue('tasks')
const dlq = new DeadLetterQueue(mainQueue, {
  queueSuffix: '-dlq',
  maxRetries: 3,
  processFailed: false,
})

// Move a failed job to DLQ manually
await dlq.moveToDeadLetter(failedJob, 'Max retries exceeded')

// Get jobs from DLQ
const deadJobs = await dlq.getDeadLetterJobs()

// Republish from DLQ to original queue
for (const job of deadJobs) {
  await dlq.republish(job)
}
```

### Dead Letter Queue Events

```typescript
queue.on('jobMovedToDeadLetter', (jobId, dlqName, reason) => {
  console.log(`Job ${jobId} moved to ${dlqName}: ${reason}`)

  // Alert operations team
  alerting.critical({
    title: 'Job Permanently Failed',
    jobId,
    reason,
    queue: dlqName,
  })
})

queue.on('jobRepublishedFromDeadLetter', (jobId, originalQueue) => {
  console.log(`Job ${jobId} republished to ${originalQueue}`)
})
```

## Failed Jobs Management

### Remove Failed Jobs

```typescript
// Remove a specific failed job
const job = await queue.getJob('failed-job-id')
await job.remove()

// Remove all failed jobs
async function clearFailedJobs(queue: Queue) {
  const failedJobs = await queue.getJobs('failed')
  for (const job of failedJobs) {
    await job.remove()
  }
}
```

### Export Failed Jobs

```typescript
async function exportFailedJobs(queue: Queue) {
  const failedJobs = await queue.getJobs('failed')

  const exported = failedJobs.map(job => ({
    id: job.id,
    data: job.data,
    reason: job.failedReason,
    attempts: job.attemptsMade,
    stacktrace: job.stacktrace,
    timestamp: job.timestamp,
    finishedOn: job.finishedOn,
  }))

  await Bun.write(
    'failed-jobs.json',
    JSON.stringify(exported, null, 2)
  )

  return exported
}
```

### Cleanup Old Failed Jobs

```typescript
async function cleanupOldFailed(queue: Queue, olderThanMs: number) {
  const failedJobs = await queue.getJobs('failed')
  const cutoff = Date.now() - olderThanMs

  let removed = 0
  for (const job of failedJobs) {
    if (job.finishedOn && job.finishedOn < cutoff) {
      await job.remove()
      removed++
    }
  }

  console.log(`Removed ${removed} old failed jobs`)
}

// Remove failed jobs older than 7 days
await cleanupOldFailed(queue, 7 * 24 * 60 * 60 * 1000)
```

## Error Handling Patterns

### Categorize Errors

```typescript
queue.process(5, async (job) => {
  try {
    return await processJob(job.data)
  } catch (error) {
    // Categorize errors for different handling
    if (error.code === 'ECONNREFUSED') {
      // Transient error - will retry
      throw new Error(`Connection failed: ${error.message}`)
    }

    if (error.code === 'INVALID_DATA') {
      // Permanent error - no retry
      job.opts.attempts = 0 // Prevent further retries
      throw new Error(`Invalid data: ${error.message}`)
    }

    // Unknown error
    throw error
  }
})
```

### Custom Failure Handler

```typescript
import { FailedJobsManager } from 'bun-queue'

const failedManager = new FailedJobsManager()

// Register handler for failed jobs
failedManager.onFailed(async (job, error) => {
  // Log to external service
  await logService.error({
    jobId: job.id,
    queue: job.name,
    error: error.message,
    data: job.data,
  })

  // Notify if critical
  if (job.data.priority === 'high') {
    await slack.notify(`High priority job failed: ${job.id}`)
  }
})
```

### Retry with Modified Data

```typescript
queue.on('jobFailed', async (jobId, error) => {
  const job = await queue.getJob(jobId)

  if (job && error.message.includes('rate limit')) {
    // Re-add with longer delay
    await queue.add(job.data, {
      ...job.opts,
      delay: 60000, // Wait 1 minute
      attempts: 3,
    })

    // Remove the failed job
    await job.remove()
  }
})
```

## Best Practices

### 1. Set Appropriate Retry Counts

```typescript
// API calls - might have rate limits
{ attempts: 5, backoff: { type: 'exponential', delay: 1000 } }

// Email sending - usually works or fails permanently
{ attempts: 3, backoff: { type: 'fixed', delay: 5000 } }

// Critical operations - needs manual review
{ attempts: 1, deadLetter: true }
```

### 2. Log Failure Information

```typescript
queue.process(5, async (job) => {
  try {
    return await processJob(job.data)
  } catch (error) {
    console.error({
      event: 'job_failed',
      jobId: job.id,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts,
      error: error.message,
      data: job.data,
    })
    throw error
  }
})
```

### 3. Monitor Failure Rates

```typescript
let successCount = 0
let failureCount = 0

queue.on('jobCompleted', () => successCount++)
queue.on('jobFailed', () => failureCount++)

setInterval(() => {
  const total = successCount + failureCount
  if (total > 0) {
    const failureRate = (failureCount / total) * 100
    console.log(`Failure rate: ${failureRate.toFixed(2)}%`)

    if (failureRate > 10) {
      alerting.warn(`High failure rate: ${failureRate}%`)
    }
  }

  // Reset counters
  successCount = 0
  failureCount = 0
}, 60000) // Every minute
```

## Next Steps

- Configure [Cron Jobs](/guide/cron)
- Learn about [Dead Letter Queues](/dead-letter-queues)
- Explore [Rate Limiting](/rate-limiting)
