---
title: Worker Configuration
description: Configure workers for processing jobs in bun-queue
---

# Worker Configuration

Workers are the processes that consume and execute jobs from queues. This guide covers worker configuration, concurrency, and best practices.

## Basic Worker Setup

### Processing Jobs

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('tasks')

// Simple worker with concurrency of 5
queue.process(5, async (job) => {
  console.log(`Processing job ${job.id}`)

  // Your job logic here
  const result = await processTask(job.data)

  return result
})
```

### Using the Worker Class

For more control, use the `Worker` class directly:

```typescript
import { Queue, Worker } from 'bun-queue'

const queue = new Queue('tasks')

const worker = new Worker(queue, async (job) => {
  console.log(`Worker processing job ${job.id}`)
  return await processTask(job.data)
}, {
  concurrency: 5,
  autostart: true,
})
```

## Worker Configuration

### Configuration Options

```typescript
interface WorkerOptions {
  // Number of concurrent jobs to process
  concurrency?: number

  // Start processing immediately
  autostart?: boolean

  // Lock duration for jobs (ms)
  lockDuration?: number

  // How often to renew lock (ms)
  lockRenewTime?: number

  // How often to check for stalled jobs (ms)
  stalledInterval?: number

  // Max stalled count before job fails
  maxStalledCount?: number

  // Drain mode - stop after current jobs
  drainDelay?: number
}
```

### Example Configuration

```typescript
const worker = new Worker(queue, processor, {
  concurrency: 10,
  autostart: true,
  lockDuration: 30000,        // 30 seconds
  lockRenewTime: 15000,       // Renew lock every 15 seconds
  stalledInterval: 30000,     // Check for stalled jobs every 30s
  maxStalledCount: 3,         // Fail job after 3 stalls
})
```

## Concurrency

### Setting Concurrency

```typescript
// Process 1 job at a time (serial)
queue.process(1, async (job) => { ... })

// Process up to 10 jobs concurrently
queue.process(10, async (job) => { ... })

// Dynamic concurrency based on system
const cores = navigator.hardwareConcurrency || 4
queue.process(cores, async (job) => { ... })
```

### Concurrency Strategies

**CPU-bound tasks** (image processing, compression):
```typescript
// Use number of CPU cores
const concurrency = navigator.hardwareConcurrency || 4
queue.process(concurrency, async (job) => {
  await processImage(job.data.imageUrl)
})
```

**I/O-bound tasks** (API calls, database operations):
```typescript
// Higher concurrency for I/O tasks
queue.process(50, async (job) => {
  await fetch(job.data.webhookUrl, {
    method: 'POST',
    body: JSON.stringify(job.data.payload),
  })
})
```

**Memory-intensive tasks**:
```typescript
// Lower concurrency to manage memory
queue.process(2, async (job) => {
  await processLargeFile(job.data.filePath)
})
```

## Job Processing

### Accessing Job Data

```typescript
queue.process(5, async (job) => {
  // Job properties
  console.log('Job ID:', job.id)
  console.log('Job name:', job.name)
  console.log('Job data:', job.data)
  console.log('Attempts made:', job.attemptsMade)
  console.log('Created at:', job.timestamp)
  console.log('Options:', job.opts)

  return { processed: true }
})
```

### Updating Progress

```typescript
queue.process(5, async (job) => {
  const items = job.data.items

  for (let i = 0; i < items.length; i++) {
    await processItem(items[i])

    // Update progress (0-100)
    const progress = Math.round((i + 1) / items.length * 100)
    await job.updateProgress(progress)
  }

  return { itemsProcessed: items.length }
})
```

### Returning Results

```typescript
queue.process(5, async (job) => {
  const result = await performTask(job.data)

  // Return value is stored with job
  return {
    success: true,
    output: result,
    processedAt: new Date().toISOString(),
  }
})

// Access result later
const completedJob = await queue.getJob('job-id')
console.log('Result:', completedJob.returnvalue)
```

### Throwing Errors

```typescript
queue.process(5, async (job) => {
  if (!job.data.requiredField) {
    throw new Error('Required field missing')
  }

  try {
    return await riskyOperation(job.data)
  } catch (error) {
    // Re-throw to trigger retry
    throw new Error(`Operation failed: ${error.message}`)
  }
})
```

## Worker Lifecycle

### Starting and Stopping

```typescript
const worker = new Worker(queue, processor, {
  autostart: false, // Don't start automatically
})

// Start processing
await worker.start()

// Pause processing (finish current jobs)
await worker.pause()

// Resume processing
await worker.resume()

// Stop gracefully (wait for current jobs)
await worker.close()

// Force stop (abandon current jobs)
await worker.close(true)
```

### Graceful Shutdown

```typescript
import { Queue, Worker } from 'bun-queue'

const queue = new Queue('tasks')
const worker = new Worker(queue, processor, { concurrency: 10 })

// Handle shutdown signals
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...')

  // Stop accepting new jobs
  await worker.pause()

  // Wait for current jobs to complete (with timeout)
  const timeout = setTimeout(() => {
    console.log('Shutdown timeout, forcing close')
    process.exit(1)
  }, 30000)

  await worker.close()
  clearTimeout(timeout)

  console.log('Worker shut down gracefully')
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down...')
  await worker.close()
  process.exit(0)
})
```

## Event Handling

### Worker Events

```typescript
queue.on('jobActive', (jobId) => {
  console.log(`Job ${jobId} is now active`)
})

queue.on('jobCompleted', (jobId, result) => {
  console.log(`Job ${jobId} completed:`, result)
})

queue.on('jobFailed', (jobId, error) => {
  console.error(`Job ${jobId} failed:`, error)
})

queue.on('jobProgress', (jobId, progress) => {
  console.log(`Job ${jobId} progress: ${progress}%`)
})

queue.on('jobStalled', (jobId) => {
  console.warn(`Job ${jobId} stalled`)
})

queue.on('ready', () => {
  console.log('Queue ready to process jobs')
})

queue.on('error', (error) => {
  console.error('Queue error:', error)
})
```

## Multiple Workers

### Same Machine

Run multiple workers on the same machine:

```typescript
import { Queue, Worker } from 'bun-queue'

const queue = new Queue('tasks')

// Create multiple workers
const workers = Array.from({ length: 4 }, (_, i) =>
  new Worker(queue, async (job) => {
    console.log(`Worker ${i} processing job ${job.id}`)
    return await processJob(job)
  }, {
    concurrency: 5,
  })
)

// Shutdown all workers
async function shutdownAll() {
  await Promise.all(workers.map(w => w.close()))
}
```

### Distributed Workers

For distributed processing across machines:

```typescript
// worker-1.ts (Machine 1)
import { Queue, Worker } from 'bun-queue'

const queue = new Queue('tasks', {
  redis: { url: 'redis://shared-redis:6379' },
})

new Worker(queue, processJob, {
  concurrency: 10,
})
```

```typescript
// worker-2.ts (Machine 2)
import { Queue, Worker } from 'bun-queue'

const queue = new Queue('tasks', {
  redis: { url: 'redis://shared-redis:6379' },
})

new Worker(queue, processJob, {
  concurrency: 10,
})
```

## Job Processor Factory

Create specialized processors:

```typescript
import { Queue } from 'bun-queue'

interface ProcessorOptions {
  timeout: number
  retryOnError: boolean
}

function createProcessor(options: ProcessorOptions) {
  return async (job: Job) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeout)

    try {
      const result = await processWithSignal(job.data, controller.signal)
      return result
    } catch (error) {
      if (options.retryOnError) {
        throw error // Triggers retry
      }
      return { error: error.message, failed: true }
    } finally {
      clearTimeout(timeout)
    }
  }
}

const queue = new Queue('tasks')
queue.process(5, createProcessor({
  timeout: 30000,
  retryOnError: true,
}))
```

## Best Practices

### Error Handling

```typescript
queue.process(5, async (job) => {
  try {
    return await processJob(job.data)
  } catch (error) {
    // Log the error
    console.error(`Job ${job.id} error:`, error)

    // Optionally update job with error info
    job.stacktrace.push(error.stack)

    // Re-throw to trigger retry
    throw error
  }
})
```

### Resource Cleanup

```typescript
queue.process(5, async (job) => {
  const connection = await getConnection()

  try {
    const result = await connection.process(job.data)
    return result
  } finally {
    // Always cleanup resources
    await connection.close()
  }
})
```

### Idempotency

```typescript
queue.process(5, async (job) => {
  // Check if already processed
  const existing = await db.results.findByJobId(job.id)
  if (existing) {
    console.log(`Job ${job.id} already processed`)
    return existing
  }

  // Process the job
  const result = await processJob(job.data)

  // Store result with job ID for idempotency
  await db.results.create({
    jobId: job.id,
    result,
    processedAt: new Date(),
  })

  return result
})
```

## Next Steps

- Learn about [Failed Jobs](/guide/failed)
- Configure [Cron Jobs](/guide/cron)
- Explore [Rate Limiting](/rate-limiting)
