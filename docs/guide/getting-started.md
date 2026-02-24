# Getting Started

Learn how to install and set up bun-queue in your Bun project.

## Prerequisites

- [Bun](https://bun.sh) v1.0 or higher
- Redis server (local or remote)

## Installation

Install bun-queue using Bun:

```bash
bun add bun-queue
```

## Configuration

### Environment Variables

bun-queue reads the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |

### Queue Configuration

You can configure queues programmatically:

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('tasks', {
  redis: {
    url: 'redis://username:password@localhost:6379'
    // Or provide your own client
    // client: myRedisClient
  },
  prefix: 'myapp', // prefix for Redis keys (default: 'queue')
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  },
  verbose: true,
  logLevel: 'info' // 'debug' | 'info' | 'warn' | 'error' | 'silent'
})
```

### Configuration Options

```typescript
interface QueueConfig {
  verbose?: boolean
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent'
  redis?: {
    url?: string
    client?: RedisClient
  }
  prefix?: string
  defaultJobOptions?: JobOptions
  limiter?: RateLimiter
  metrics?: {
    enabled: boolean
    collectInterval?: number
  }
  stalledJobCheckInterval?: number
  maxStalledJobRetries?: number
  distributedLock?: boolean
  defaultDeadLetterOptions?: DeadLetterQueueOptions
  horizontalScaling?: {
    enabled?: boolean
    instanceId?: string
    maxWorkersPerInstance?: number
    jobsPerWorker?: number
    leaderElection?: {
      heartbeatInterval?: number
      leaderTimeout?: number
    }
    workCoordination?: {
      pollInterval?: number
      keyPrefix?: string
    }
  }
}
```

## Basic Usage

### Creating a Queue

```typescript
import { Queue } from 'bun-queue'

const emailQueue = new Queue('emails')
```

### Adding Jobs

```typescript
// Add a simple job
const job = await emailQueue.add({
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Welcome to our platform!'
})

console.log(`Job ${job.id} added to the queue`)
```

### Processing Jobs

```typescript
// Process jobs with concurrency of 5
emailQueue.process(5, async (job) => {
  const { to, subject, body } = job.data

  // Update progress
  await job.updateProgress(10)

  // Simulate sending email
  console.log(`Sending email to ${to} with subject: ${subject}`)
  await new Promise(resolve => setTimeout(resolve, 1000))

  await job.updateProgress(100)

  return { sent: true, timestamp: Date.now() }
})
```

## Job Events

Listen to job lifecycle events:

```typescript
emailQueue.on('jobCompleted', (jobId, result) => {
  console.log(`Job ${jobId} completed with result:`, result)
})

emailQueue.on('jobFailed', (jobId, error) => {
  console.error(`Job ${jobId} failed:`, error)
})

emailQueue.on('jobProgress', (jobId, progress) => {
  console.log(`Job ${jobId} progress: ${progress}%`)
})

emailQueue.on('jobStalled', (jobId) => {
  console.warn(`Job ${jobId} stalled`)
})
```

## Next Steps

- Learn about [defining and dispatching jobs](./jobs.md)
- Explore [job prioritization](./priority.md)
- Set up [rate limiting](./rate-limiting.md)
- Configure [dead letter queues](./dead-letter-queue.md)
