---
title: Queue Configuration
description: Configure bun-queue with various options for Redis, rate limiting, metrics, and more.
---

# Queue Configuration

bun-queue provides extensive configuration options to customize queue behavior.

## Basic Configuration

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('tasks', {
  redis: {
    url: 'redis://username:password@localhost:6379'
  },
  prefix: 'myapp',          // Prefix for Redis keys (default: 'queue')
  verbose: true,            // Enable verbose logging
  logLevel: 'info',         // Log level: 'debug' | 'info' | 'warn' | 'error' | 'silent'
})
```

## Redis Configuration

### Connection String

```typescript
const queue = new Queue('tasks', {
  redis: {
    url: 'redis://localhost:6379'
  }
})
```

### Custom Redis Client

```typescript
const queue = new Queue('tasks', {
  redis: {
    client: myRedisClient // Provide your own client
  }
})
```

### Environment Variables

bun-queue reads these environment variables:

- `REDIS_URL`: Redis connection string (default: `redis://localhost:6379`)

```bash
# .env
REDIS_URL=redis://localhost:6379
```

## Default Job Options

Set default options for all jobs in a queue:

```typescript
const queue = new Queue('tasks', {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false,
    timeout: 60000
  }
})
```

## Rate Limiting

Configure rate limiting to control job processing speed:

```typescript
const queue = new Queue('api-calls', {
  limiter: {
    max: 100,         // Maximum jobs per duration
    duration: 60000,  // Duration in milliseconds (1 minute)
    keyPrefix: (data) => data.userId // Optional: rate limit per key
  }
})
```

### Key-Based Rate Limiting

Rate limit based on job data:

```typescript
const queue = new Queue('api-calls', {
  limiter: {
    max: 10,
    duration: 1000,
    keyPrefix: (data) => `user:${data.userId}` // Limit per user
  }
})
```

## Metrics Configuration

Enable built-in metrics collection:

```typescript
const queue = new Queue('tasks', {
  metrics: {
    enabled: true,
    collectInterval: 5000 // Collect metrics every 5 seconds
  }
})

// Get metrics
const metrics = await queue.getMetrics()
console.log(metrics)
```

## Stalled Job Detection

Configure detection and handling of stalled jobs:

```typescript
const queue = new Queue('tasks', {
  stalledJobCheckInterval: 30000, // Check every 30 seconds
  maxStalledJobRetries: 3         // Retry stalled jobs up to 3 times
})
```

## Distributed Lock

Enable distributed locking for job processing:

```typescript
const queue = new Queue('tasks', {
  distributedLock: true // Enable distributed locks (default)
})
```

## Dead Letter Queue

Configure automatic dead letter queue handling:

```typescript
const queue = new Queue('tasks', {
  defaultDeadLetterOptions: {
    enabled: true,
    queueSuffix: '-dead-letter', // Suffix for dead letter queue name
    maxRetries: 3,               // Move to DLQ after 3 failures
    removeFromOriginalQueue: true
  }
})
```

## Horizontal Scaling

Configure horizontal scaling for distributed processing:

```typescript
const queue = new Queue('tasks', {
  horizontalScaling: {
    enabled: true,
    instanceId: 'worker-1',        // Unique ID for this instance
    maxWorkersPerInstance: 10,
    jobsPerWorker: 10,
    leaderElection: {
      heartbeatInterval: 5000,
      leaderTimeout: 30000
    },
    workCoordination: {
      pollInterval: 1000,
      keyPrefix: 'coordinator'
    }
  }
})
```

### Cluster Information

Get information about the cluster:

```typescript
// Check if this instance is the leader
const isLeader = queue.isLeader()

// Get current leader ID
const leaderId = await queue.getLeaderId()

// Get cluster information
const clusterInfo = await queue.getClusterInfo()
```

## Full Configuration Example

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('production-tasks', {
  // Redis connection
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },

  // Key prefix
  prefix: 'myapp',

  // Logging
  verbose: true,
  logLevel: 'info',

  // Default job options
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: false,
    timeout: 30000
  },

  // Rate limiting
  limiter: {
    max: 1000,
    duration: 60000
  },

  // Metrics
  metrics: {
    enabled: true,
    collectInterval: 10000
  },

  // Stalled jobs
  stalledJobCheckInterval: 30000,
  maxStalledJobRetries: 3,

  // Distributed lock
  distributedLock: true,

  // Dead letter queue
  defaultDeadLetterOptions: {
    enabled: true,
    maxRetries: 5
  },

  // Horizontal scaling
  horizontalScaling: {
    enabled: true,
    instanceId: process.env.INSTANCE_ID || 'default',
    maxWorkersPerInstance: 10,
    jobsPerWorker: 5
  }
})
```

## Queue Management

### Pause and Resume

```typescript
// Pause the queue
await queue.pause()

// Resume the queue
await queue.resume()
```

### Health Check

```typescript
// Check Redis connection
const isHealthy = await queue.ping()
console.log('Queue healthy:', isHealthy)
```

### Close Queue

```typescript
// Gracefully close the queue
await queue.close()
```
