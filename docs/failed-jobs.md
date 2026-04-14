---
title: Failed Job Handling
description: Learn how to handle, retry, and manage failed jobs.
---

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
