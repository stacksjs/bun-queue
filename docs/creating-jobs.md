---
title: Creating Jobs
description: Learn how to create and add jobs to the queue with various options.
---

  for (let i = 0; i < items.length; i++) {
    await processItem(items[i])

    // Update progress (0-100)
    await job.updateProgress(Math.round((i + 1) / items.length * 100))
  }

  return { processed: items.length }
})
```

## Custom Job IDs

Prevent duplicate jobs by using custom IDs:

```typescript
// This ensures only one job per user order
await queue.add(
  { orderId: 12345, action: 'process' },
  { jobId: `order-${12345}` }
)

// Adding the same job ID again won't create a duplicate
await queue.add(
  { orderId: 12345, action: 'process' },
  { jobId: `order-${12345}` }
)
```

## Job Lifecycle Events

Listen to job events:

```typescript
const queue = new Queue('tasks')

// Listen to job events
queue.events.on('jobAdded', (jobId, queueName) => {
  console.log(`Job ${jobId} added to ${queueName}`)
})

queue.events.on('jobCompleted', (jobId, result) => {
  console.log(`Job ${jobId} completed:`, result)
})

queue.events.on('jobFailed', (jobId, error) => {
  console.error(`Job ${jobId} failed:`, error)
})

queue.events.on('jobProgress', (jobId, progress) => {
  console.log(`Job ${jobId} progress: ${progress}%`)
})
```

## Retrieving Jobs

Get job information after creation:

```typescript
// Get a job by ID
const job = await queue.getJob('job-id')

if (job) {
  console.log('Job data:', job.data)
  console.log('Progress:', job.progress)
  console.log('Attempts:', job.attemptsMade)
}

// Get jobs by status
const waitingJobs = await queue.getJobs('waiting')
const activeJobs = await queue.getJobs('active')
const completedJobs = await queue.getJobs('completed')
const failedJobs = await queue.getJobs('failed')

// Get job counts
const counts = await queue.getJobCounts()
console.log(counts)
// { waiting: 5, active: 2, completed: 10, failed: 1, delayed: 3, paused: 0 }
```

## Removing Jobs

Remove jobs from the queue:

```typescript
// Remove a specific job
const job = await queue.getJob('job-id')
await job.remove()

// Bulk remove multiple jobs
await queue.bulkRemove(['job-1', 'job-2', 'job-3'])

// Clear all jobs
await queue.empty()
```
