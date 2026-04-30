---
title: Queue Configuration
description: Configure bun-queue with various options for Redis, rate limiting, metrics, and more.
---
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
