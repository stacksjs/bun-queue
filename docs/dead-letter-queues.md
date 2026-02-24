---
title: Dead Letter Queues
description: Handle permanently failed jobs with dead letter queues.
---

# Dead Letter Queues

Dead letter queues (DLQ) capture jobs that have failed multiple times and cannot be processed, allowing you to inspect and reprocess them later.

## Enabling Dead Letter Queue

### Queue-Level Configuration

Enable DLQ for all jobs in a queue:

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('emails', {
  defaultDeadLetterOptions: {
    enabled: true,
    queueSuffix: '-dead-letter',  // Creates 'emails-dead-letter'
    maxRetries: 3,                 // Move to DLQ after 3 failures
    removeFromOriginalQueue: true
  }
})
```

### Job-Level Configuration

Enable DLQ for specific jobs:

```typescript
// Enable DLQ for this job
await queue.add(data, {
  attempts: 3,
  deadLetter: true
})

// With custom options
await queue.add(data, {
  attempts: 5,
  deadLetter: {
    enabled: true,
    maxRetries: 5,
    queueSuffix: '-failed'
  }
})
```

## How Dead Letter Queues Work

1. Job is added to the queue
2. Worker attempts to process the job
3. If processing fails, job is retried (based on `attempts`)
4. After all retries are exhausted, job moves to the dead letter queue
5. Jobs in DLQ can be inspected, reprocessed, or removed

```
Main Queue → Processing → Failed (retry) → ... → Dead Letter Queue
                ↓                                        ↓
            Success                              Inspect/Reprocess
```

## Getting Dead Letter Jobs

```typescript
// Get jobs from the dead letter queue
const dlqJobs = await queue.getDeadLetterJobs()

for (const job of dlqJobs) {
  console.log('Job ID:', job.id)
  console.log('Original data:', job.data)
  console.log('Failed reason:', job.failedReason)
  console.log('Attempts made:', job.attemptsMade)
  console.log('Stacktrace:', job.stacktrace)
}

// Get with pagination
const dlqJobsPage = await queue.getDeadLetterJobs(0, 10)  // First 10 jobs
```

## Republishing Dead Letter Jobs

Reprocess jobs from the dead letter queue:

```typescript
// Republish a specific job
const job = await queue.republishDeadLetterJob('job-id')

if (job) {
  console.log(`Job ${job.id} republished to the main queue`)
}

// Republish with reset retries
await queue.republishDeadLetterJob('job-id', {
  resetRetries: true  // Reset attempt counter
})
```

## Removing Dead Letter Jobs

```typescript
// Remove a specific job from DLQ
const removed = await queue.removeDeadLetterJob('job-id')

if (removed) {
  console.log('Job removed from dead letter queue')
}

// Clear entire dead letter queue
await queue.clearDeadLetterQueue()
```

## Manual Movement to DLQ

Manually move a job to the dead letter queue:

```typescript
await queue.moveToDeadLetter('job-id', 'Manual intervention required')
```

## Dead Letter Queue Events

Listen for DLQ events:

```typescript
queue.events.on('jobMovedToDeadLetter', (jobId, dlqName, reason) => {
  console.log(`Job ${jobId} moved to ${dlqName}: ${reason}`)

  // Send notification
  notifyAdmins({
    type: 'job-moved-to-dlq',
    jobId,
    reason
  })
})

queue.events.on('jobRepublishedFromDeadLetter', (jobId, originalQueueName) => {
  console.log(`Job ${jobId} republished to ${originalQueueName}`)
})
```

## Accessing the Dead Letter Queue Directly

```typescript
const dlq = queue.getDeadLetterQueue()

// Get DLQ name
const dlqName = dlq.getQueueName()
console.log('Dead letter queue name:', dlqName)

// Get all jobs
const jobs = await dlq.getJobs()

// Move a job to DLQ
await dlq.moveToDeadLetter(failedJob, 'Processing timeout')

// Republish a job
await dlq.republishJob('job-id', { resetRetries: true })

// Remove a job
await dlq.removeJob('job-id')

// Clear the queue
await dlq.clear()
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | false | Enable dead letter queue |
| `queueSuffix` | string | '-dead-letter' | Suffix for DLQ name |
| `maxRetries` | number | 3 | Move to DLQ after this many failures |
| `processFailed` | boolean | false | Automatically process failed jobs |
| `removeFromOriginalQueue` | boolean | true | Remove from failed list when moving to DLQ |

## Practical Examples

### Email Processing with DLQ

```typescript
const emailQueue = new Queue('emails', {
  defaultDeadLetterOptions: {
    enabled: true,
    maxRetries: 3
  }
})

emailQueue.process(5, async (job) => {
  const { to, subject, body } = job.data

  const result = await sendEmail(to, subject, body)

  if (!result.success) {
    throw new Error(`Failed to send email: ${result.error}`)
  }

  return { sent: true }
})

// Monitor dead letter queue
setInterval(async () => {
  const dlqJobs = await emailQueue.getDeadLetterJobs()

  if (dlqJobs.length > 0) {
    console.log(`${dlqJobs.length} emails in dead letter queue`)

    // Notify admins if too many failures
    if (dlqJobs.length > 10) {
      await notifyAdmins('High number of email failures')
    }
  }
}, 60000)
```

### Payment Processing with Review

```typescript
const paymentQueue = new Queue('payments', {
  defaultDeadLetterOptions: {
    enabled: true,
    maxRetries: 5,
    queueSuffix: '-review'
  }
})

// Process DLQ jobs with manual review
async function reviewFailedPayments() {
  const failedPayments = await paymentQueue.getDeadLetterJobs()

  for (const job of failedPayments) {
    const review = await manualReview(job.data)

    if (review.approved) {
      // Fix the issue and reprocess
      await paymentQueue.republishDeadLetterJob(job.id, {
        resetRetries: true
      })
    } else {
      // Mark as permanently failed
      await paymentQueue.removeDeadLetterJob(job.id)
      await logPermanentFailure(job)
    }
  }
}
```

### Batch Reprocessing

```typescript
async function reprocessAllDLQJobs() {
  const dlqJobs = await queue.getDeadLetterJobs()

  let success = 0
  let failed = 0

  for (const job of dlqJobs) {
    try {
      await queue.republishDeadLetterJob(job.id, {
        resetRetries: true
      })
      success++
    } catch (error) {
      console.error(`Failed to republish ${job.id}:`, error)
      failed++
    }
  }

  console.log(`Reprocessed: ${success} success, ${failed} failed`)
}
```
