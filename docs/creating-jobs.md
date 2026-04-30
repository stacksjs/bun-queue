---
title: Creating Jobs
description: Learn how to create and add jobs to the queue with various options.
---
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
