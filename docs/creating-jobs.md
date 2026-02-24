---
title: Creating Jobs
description: Learn how to create and add jobs to the queue with various options.
---

# Creating Jobs

Jobs are the fundamental units of work in bun-queue. Each job contains data that will be processed by a worker.

## Basic Job Creation

The simplest way to add a job is to call the `add` method on a queue:

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('tasks')

// Add a simple job
const job = await queue.add({
  task: 'process-image',
  imageUrl: 'https://example.com/image.jpg'
})

console.log(`Job ${job.id} added to the queue`)
```

## Job Options

Jobs support various options to control their behavior:

```typescript
await queue.add(
  { task: 'process-pdf', url: 'https://example.com/document.pdf' },
  {
    delay: 5000,           // Delay for 5 seconds before processing
    attempts: 3,           // Retry up to 3 times on failure
    backoff: {
      type: 'exponential', // 'fixed' or 'exponential' backoff
      delay: 1000,         // Base delay in milliseconds
    },
    priority: 10,          // Higher number = higher priority
    removeOnComplete: true, // Remove job when completed
    lifo: false,           // Process in FIFO order (default)
    jobId: 'custom-id',    // Provide a custom job ID
    timeout: 30000,        // Job timeout in milliseconds
  }
)
```

## Delayed Jobs

Schedule jobs to run after a specific delay:

```typescript
// Add a job that will be processed after 30 seconds
await queue.add(
  { task: 'send-reminder', userId: 123 },
  { delay: 30000 }
)

// Schedule a job for a specific time
const futureTime = new Date('2024-12-25T10:00:00').getTime()
const delay = futureTime - Date.now()

await queue.add(
  { task: 'send-christmas-greeting' },
  { delay }
)
```

## Job Dependencies

Jobs can depend on other jobs and will only run after their dependencies complete:

```typescript
// First job - create report data
const dataJob = await queue.add({
  task: 'generate-report-data',
  reportId: 'monthly-sales'
})

// Second job - depends on first job
const pdfJob = await queue.add(
  { task: 'generate-pdf', reportId: 'monthly-sales' },
  { dependsOn: dataJob.id }
)

// Third job - depends on multiple jobs
const emailJob = await queue.add(
  { task: 'send-report-email', reportId: 'monthly-sales' },
  { dependsOn: [dataJob.id, pdfJob.id] }
)
```

## Batch Job Creation

Add multiple jobs efficiently:

```typescript
import { JobContract } from 'bun-queue'

// Define job classes
class SendEmailJob implements JobContract {
  constructor(
    public email: string,
    public subject: string
  ) {}

  async handle() {
    await sendEmail(this.email, this.subject)
  }
}

// Add as a batch
const jobs = [
  new SendEmailJob('user1@example.com', 'Welcome'),
  new SendEmailJob('user2@example.com', 'Welcome'),
  new SendEmailJob('user3@example.com', 'Welcome'),
]

const addedJobs = await queue.addJobBatch(jobs, {
  batchId: 'welcome-emails-batch',
  allowFailures: true
})
```

## Job Progress Tracking

Update and track job progress during processing:

```typescript
queue.process(1, async (job) => {
  const items = job.data.items

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
