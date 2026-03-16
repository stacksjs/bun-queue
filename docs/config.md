---
title: Configuration File
description: Configure bun-queue using a configuration file.
---

# Configuration File

bun-queue can be configured using a `queue.config.ts` file or by passing options directly to the `Queue` constructor.

## Constructor Options

```typescript
import { Queue } from '@stacksjs/bun-queue'

const queue = new Queue('tasks', {
  // Redis connection
  redis: {
    url: 'redis://localhost:6379',
    // or provide an existing client:
    // client: myRedisClient,
  },

  // Key prefix for all Redis keys (default: 'queue')
  prefix: 'myapp',

  // Logging
  logLevel: 'info', // 'debug' | 'info' | 'warn' | 'error' | 'silent'

  // Default options applied to every job
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: false,
    timeout: 30000,
  },

  // Rate limiting
  limiter: {
    max: 1000,
    duration: 60000,
  },

  // Metrics collection
  metrics: {
    enabled: true,
    collectInterval: 10000,
  },

  // Stalled job detection
  stalledJobCheckInterval: 30000,
  maxStalledJobRetries: 3,

  // Distributed locking (default: true)
  distributedLock: true,

  // Dead letter queue
  defaultDeadLetterOptions: {
    enabled: true,
    queueSuffix: '-dead-letter',
    maxRetries: 5,
    removeFromOriginalQueue: true,
  },

  // Horizontal scaling
  horizontalScaling: {
    enabled: true,
    instanceId: process.env.INSTANCE_ID,
    maxWorkersPerInstance: 10,
    jobsPerWorker: 5,
    leaderElection: {
      heartbeatInterval: 5000,
      leaderTimeout: 30000,
    },
    workCoordination: {
      pollInterval: 1000,
    },
  },
})
```

## Options Reference

### `QueueConfig`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `redis.url` | `string` | `redis://localhost:6379` | Redis connection URL |
| `redis.client` | `RedisClient` | — | Existing Redis client |
| `prefix` | `string` | `'queue'` | Redis key prefix |
| `logLevel` | `LogLevel` | `'warn'` | Logging verbosity |
| `defaultJobOptions` | `JobOptions` | `{}` | Defaults for all jobs |
| `limiter` | `RateLimiter` | — | Rate limiting config |
| `metrics.enabled` | `boolean` | `false` | Enable metrics |
| `metrics.collectInterval` | `number` | `5000` | Metrics interval (ms) |
| `stalledJobCheckInterval` | `number` | — | Stalled check interval (ms) |
| `maxStalledJobRetries` | `number` | `3` | Max stalled retries |
| `distributedLock` | `boolean` | `true` | Enable distributed locks |
| `defaultDeadLetterOptions` | `DeadLetterQueueOptions` | — | DLQ defaults |
| `horizontalScaling` | `object` | — | Horizontal scaling config |

### `JobOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delay` | `number` | `0` | Delay before processing (ms) |
| `attempts` | `number` | `1` | Max retry attempts |
| `backoff` | `{ type, delay }` | — | Retry backoff strategy |
| `backoff.type` | `'fixed' \| 'exponential'` | — | Backoff type |
| `backoff.delay` | `number` | — | Base delay (ms) |
| `removeOnComplete` | `boolean \| number` | `false` | Remove on complete, or keep N |
| `removeOnFail` | `boolean \| number` | `false` | Remove on fail, or keep N |
| `priority` | `number` | `0` | Higher = processed first |
| `lifo` | `boolean` | `false` | Last-in-first-out order |
| `timeout` | `number` | — | Job timeout (ms) |
| `jobId` | `string` | auto | Custom job ID |
| `dependsOn` | `string \| string[]` | — | Job dependency IDs |
| `deadLetter` | `boolean \| DeadLetterQueueOptions` | — | Per-job DLQ config |
| `repeat.cron` | `string` | — | Cron expression |
| `repeat.every` | `number` | — | Repeat interval (ms) |
| `repeat.limit` | `number` | — | Max repetitions |

### `DeadLetterQueueOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable DLQ |
| `queueSuffix` | `string` | `'-dead-letter'` | DLQ name suffix |
| `maxRetries` | `number` | `3` | Retries before DLQ |
| `processFailed` | `boolean` | `false` | Auto-process failed |
| `removeFromOriginalQueue` | `boolean` | `true` | Remove from failed list |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
