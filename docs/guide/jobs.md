# Defining and Dispatching Jobs

Learn how to define jobs, configure job options, and dispatch them to queues.

## Adding Jobs to Queues

### Basic Job Addition

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('tasks')

// Add a job with data
const job = await queue.add({
  task: 'process-pdf',
  url: 'https://example.com/document.pdf'
})

console.log(`Job ID: ${job.id}`)
```

### Job Options

Configure job behavior with options:

```typescript
await queue.add(
  { task: 'process-pdf', url: 'https://example.com/document.pdf' },
  {
    delay: 5000,              // delay for 5 seconds
    attempts: 3,              // retry up to 3 times
    backoff: {
      type: 'exponential',    // 'fixed' or 'exponential'
      delay: 1000,            // milliseconds
    },
    priority: 10,             // higher number = higher priority
    removeOnComplete: true,   // remove job when completed
    removeOnFail: false,      // keep failed jobs
    lifo: false,              // process in FIFO order (default)
    timeout: 30000,           // job timeout in ms
    jobId: 'custom-id',       // provide custom job ID
  }
)
```

### All Job Options

```typescript
interface JobOptions {
  delay?: number              // Delay before processing (ms)
  attempts?: number           // Max retry attempts
  backoff?: {
    type: 'fixed' | 'exponential'
    delay: number             // Base delay in ms
  }
  removeOnComplete?: boolean | number  // Remove after completion (or keep N jobs)
  removeOnFail?: boolean | number      // Remove after failure (or keep N jobs)
  priority?: number           // Higher = processed first
  lifo?: boolean              // Last-in-first-out processing
  timeout?: number            // Job timeout in ms
  jobId?: string              // Custom job ID
  repeat?: {
    every: number             // Repeat interval in ms
    limit?: number            // Max repetitions
    count?: number            // Current count
    cron?: string             // Cron expression
    tz?: string               // Timezone
    startDate?: Date | number
    endDate?: Date | number
  }
  dependsOn?: string | string[]  // Job dependencies
  keepJobs?: boolean          // Keep job data after completion
  deadLetter?: boolean | DeadLetterQueueOptions
}
```

## Delayed Jobs

Schedule jobs to run in the future:

```typescript
// Process in 30 seconds
await queue.add(
  { task: 'send-reminder' },
  { delay: 30000 }
)

// Process at a specific time
const delay = new Date('2024-12-25').getTime() - Date.now()
await queue.add(
  { task: 'christmas-greeting' },
  { delay }
)
```

## Job Retries

Configure automatic retries with backoff:

```typescript
// Fixed backoff: retry every 5 seconds
await queue.add(
  { task: 'api-call' },
  {
    attempts: 5,
    backoff: {
      type: 'fixed',
      delay: 5000
    }
  }
)

// Exponential backoff: 1s, 2s, 4s, 8s, 16s
await queue.add(
  { task: 'api-call' },
  {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
)
```

## Job Management

### Get Job by ID

```typescript
const job = await queue.getJob('job-id')
if (job) {
  console.log('Job data:', job.data)
  console.log('Job status:', job.status)
}
```

### Get Jobs by Status

```typescript
const waitingJobs = await queue.getJobs('waiting')
const activeJobs = await queue.getJobs('active')
const completedJobs = await queue.getJobs('completed')
const failedJobs = await queue.getJobs('failed')
const delayedJobs = await queue.getJobs('delayed')
```

### Get Job Counts

```typescript
const counts = await queue.getJobCounts()
console.log(counts)
// { waiting: 5, active: 2, completed: 10, failed: 1, delayed: 3, paused: 0 }
```

### Retry Failed Jobs

```typescript
const failedJob = await queue.getJob('failed-job-id')
if (failedJob) {
  await failedJob.retry()
}
```

### Remove Jobs

```typescript
// Remove a specific job
await job.remove()

// Clear all jobs from queue
await queue.empty()
```

## Queue Control

### Pause and Resume

```typescript
// Pause the queue
await queue.pause()

// Resume processing
await queue.resume()
```

### Check if Paused

```typescript
const isPaused = await queue.isPaused()
```

## Job Processing

### Processing with Concurrency

```typescript
// Process up to 5 jobs concurrently
queue.process(5, async (job) => {
  console.log('Processing job:', job.id)
  return { success: true }
})
```

### Updating Job Progress

```typescript
queue.process(1, async (job) => {
  await job.updateProgress(0)

  // Step 1
  await doStep1()
  await job.updateProgress(33)

  // Step 2
  await doStep2()
  await job.updateProgress(66)

  // Step 3
  await doStep3()
  await job.updateProgress(100)

  return { completed: true }
})
```

### Accessing Job Properties

```typescript
queue.process(1, async (job) => {
  console.log('Job ID:', job.id)
  console.log('Job name:', job.name)
  console.log('Job data:', job.data)
  console.log('Attempts made:', job.attemptsMade)
  console.log('Timestamp:', job.timestamp)

  return job.data
})
```

## Job Dependencies

Create jobs that depend on other jobs:

```typescript
// Create parent job
const parentJob = await queue.add({ task: 'prepare-data' })

// Create child job that depends on parent
await queue.add(
  { task: 'process-data' },
  { dependsOn: parentJob.id }
)

// Multiple dependencies
await queue.add(
  { task: 'final-step' },
  { dependsOn: [job1.id, job2.id, job3.id] }
)
```

## Next Steps

- Learn about [job prioritization](./priority.md)
- Configure [rate limiting](./rate-limiting.md)
- Set up [cron jobs](./cron-jobs.md)
