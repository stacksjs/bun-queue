---
title: Dead Letter Queues
description: Handle permanently failed jobs with dead letter queues.
---

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
