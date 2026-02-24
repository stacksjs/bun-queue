# Dead Letter Queues

Learn how to handle permanently failed jobs by moving them to dead letter queues for later inspection and reprocessing.

## Overview

A Dead Letter Queue (DLQ) is a separate queue where jobs that have failed after all retry attempts are moved. This allows you to:

- Inspect failed jobs without blocking the main queue
- Analyze failure patterns
- Manually retry or remove problematic jobs
- Maintain a history of failures

## Enabling Dead Letter Queues

Enable DLQ when creating a queue:

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('emails', {
  defaultDeadLetterOptions: {
    enabled: true,
    queueSuffix: '-dead-letter',  // Creates 'emails-dead-letter' queue
    maxRetries: 3                  // Move to DLQ after 3 failures
  }
})
```

## Dead Letter Queue Options

```typescript
interface DeadLetterQueueOptions {
  queueSuffix?: string           // Suffix for DLQ name (default: '-dead-letter')
  maxRetries?: number            // Max retries before moving to DLQ (default: 3)
  processFailed?: boolean        // Auto-process failed jobs (default: false)
  removeFromOriginalQueue?: boolean  // Remove from failed list (default: true)
  enabled?: boolean              // Enable DLQ (default: false)
}
```

## Per-Job DLQ Settings

Enable DLQ for specific jobs:

```typescript
// Enable DLQ with defaults
await queue.add(
  { task: 'important-task' },
  { deadLetter: true }
)

// Custom DLQ options for this job
await queue.add(
  { task: 'critical-task' },
  {
    deadLetter: {
      queueSuffix: '-critical-failures',
      maxRetries: 5
    }
  }
)
```

## Working with Dead Letter Queues

### Creating a DLQ Instance

```typescript
import { Queue, DeadLetterQueue } from 'bun-queue'

const mainQueue = new Queue('orders')
const dlq = new DeadLetterQueue(mainQueue, {
  queueSuffix: '-dead-letter',
  maxRetries: 3
})
```

### Getting DLQ Name

```typescript
const dlqName = dlq.getQueueName()
console.log(dlqName) // 'orders-dead-letter'
```

### Retrieving Failed Jobs

```typescript
// Get all jobs in the DLQ
const failedJobs = await dlq.getJobs()

for (const job of failedJobs) {
  console.log(`Job ${job.id}: ${job.failedReason}`)
  console.log('Data:', job.data)
  console.log('Attempts:', job.attemptsMade)
  console.log('Stacktrace:', job.stacktrace)
}

// Get jobs with pagination
const pageOfJobs = await dlq.getJobs(0, 10) // First 10 jobs
const nextPage = await dlq.getJobs(10, 20)  // Next 10 jobs
```

### Republishing Jobs

Move a job back to the original queue for reprocessing:

```typescript
// Republish a specific job
const republishedJob = await dlq.republishJob('job-id-123')

// Republish with reset retry count
await dlq.republishJob('job-id-123', { resetRetries: true })

// Republish all jobs in DLQ
const failedJobs = await dlq.getJobs()
for (const job of failedJobs) {
  await dlq.republishJob(job.id, { resetRetries: true })
}
```

### Removing Jobs from DLQ

```typescript
// Remove a specific job
const removed = await dlq.removeJob('job-id-123')

// Clear the entire DLQ
await dlq.clear()
```

## Events

Listen to DLQ-related events:

```typescript
queue.on('jobMovedToDeadLetter', (jobId, dlqName, reason) => {
  console.log(`Job ${jobId} moved to ${dlqName}`)
  console.log(`Reason: ${reason}`)

  // Send alert
  notifyTeam(`Job ${jobId} permanently failed: ${reason}`)
})

queue.on('jobRepublishedFromDeadLetter', (jobId, originalQueue) => {
  console.log(`Job ${jobId} republished to ${originalQueue}`)
})
```

## Examples

### Automatic Alerting

```typescript
const paymentQueue = new Queue('payments', {
  defaultDeadLetterOptions: {
    enabled: true,
    maxRetries: 3
  }
})

paymentQueue.on('jobMovedToDeadLetter', async (jobId, dlqName, reason) => {
  const job = await paymentQueue.getJob(jobId)

  // Send alert to operations team
  await sendAlert({
    channel: '#payment-alerts',
    message: `Payment job ${jobId} failed permanently`,
    details: {
      paymentId: job?.data.paymentId,
      amount: job?.data.amount,
      reason
    }
  })
})
```

### DLQ Processing Dashboard

```typescript
import { Queue, DeadLetterQueue } from 'bun-queue'

async function getDLQStats(queueName: string) {
  const queue = new Queue(queueName)
  const dlq = new DeadLetterQueue(queue)

  const jobs = await dlq.getJobs()

  const stats = {
    total: jobs.length,
    byReason: {} as Record<string, number>,
    oldest: null as Date | null,
    newest: null as Date | null
  }

  for (const job of jobs) {
    // Count by failure reason
    const reason = job.failedReason || 'unknown'
    stats.byReason[reason] = (stats.byReason[reason] || 0) + 1

    // Track dates
    const jobDate = new Date(job.timestamp)
    if (!stats.oldest || jobDate < stats.oldest) {
      stats.oldest = jobDate
    }
    if (!stats.newest || jobDate > stats.newest) {
      stats.newest = jobDate
    }
  }

  return stats
}
```

### Batch Retry with Filtering

```typescript
async function retryFailedPayments(dlq: DeadLetterQueue) {
  const jobs = await dlq.getJobs()

  for (const job of jobs) {
    // Only retry if failure was transient
    if (job.failedReason?.includes('timeout') ||
        job.failedReason?.includes('connection')) {
      await dlq.republishJob(job.id, { resetRetries: true })
      console.log(`Retried job ${job.id}`)
    } else {
      console.log(`Skipped job ${job.id}: ${job.failedReason}`)
    }
  }
}
```

## Best Practices

1. **Enable for Critical Queues**: Always enable DLQ for payment, order, and other critical queues
2. **Set Up Alerting**: Get notified when jobs move to the DLQ
3. **Review Regularly**: Periodically review and process DLQ jobs
4. **Analyze Patterns**: Look for common failure reasons to fix root causes
5. **Set Retention Policies**: Don't let DLQ grow indefinitely
6. **Test Recovery**: Regularly test job republishing to ensure it works

## Next Steps

- Learn about [rate limiting](./rate-limiting.md)
- Configure [distributed locks](./distributed-locks.md)
- Set up [cron jobs](./cron-jobs.md)
