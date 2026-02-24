# Distributed Locks

Learn how to prevent concurrent processing of the same job across multiple workers or instances.

## Overview

Distributed locks ensure that only one worker can process a specific job at a time, even in a horizontally scaled environment with multiple queue workers. This is crucial for preventing duplicate processing and maintaining data consistency.

## Enabling Distributed Locks

Enable distributed locks when creating a queue:

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('payments', {
  distributedLock: true
})
```

## How It Works

When distributed locks are enabled:

1. Before processing a job, the worker acquires a lock in Redis
2. If another worker already has the lock, the job is skipped
3. The lock is released when processing completes (success or failure)
4. Locks have a TTL to prevent deadlocks if a worker crashes

## Configuration

Configure distributed locks with queue options:

```typescript
const queue = new Queue('critical-tasks', {
  distributedLock: true,
  stalledJobCheckInterval: 5000,    // Check for stalled jobs every 5s
  maxStalledJobRetries: 3           // Retry stalled jobs up to 3 times
})
```

## Horizontal Scaling

For multi-instance deployments, configure horizontal scaling:

```typescript
const queue = new Queue('tasks', {
  distributedLock: true,
  horizontalScaling: {
    enabled: true,
    instanceId: process.env.INSTANCE_ID || 'instance-1',
    maxWorkersPerInstance: 4,
    jobsPerWorker: 10,
    leaderElection: {
      heartbeatInterval: 5000,      // Leader heartbeat every 5s
      leaderTimeout: 15000          // Leader considered dead after 15s
    },
    workCoordination: {
      pollInterval: 1000,           // Poll for new work every 1s
      keyPrefix: 'myapp:queue'
    }
  }
})
```

## Leader Election

bun-queue supports leader election for coordinated processing:

```typescript
const queue = new Queue('scheduled-tasks', {
  horizontalScaling: {
    enabled: true,
    leaderElection: {
      heartbeatInterval: 5000,
      leaderTimeout: 15000
    }
  }
})

// Only the leader instance will run scheduled tasks
queue.on('leader', () => {
  console.log('This instance is now the leader')
  // Start scheduled tasks
})

queue.on('follower', () => {
  console.log('This instance is now a follower')
  // Stop scheduled tasks
})
```

## Stalled Job Detection

Detect and handle jobs that have stalled (worker died during processing):

```typescript
const queue = new Queue('critical-ops', {
  distributedLock: true,
  stalledJobCheckInterval: 10000,   // Check every 10 seconds
  maxStalledJobRetries: 3           // Max retries for stalled jobs
})

queue.on('jobStalled', (jobId) => {
  console.log(`Job ${jobId} has stalled and will be retried`)
})
```

## Use Cases

### Payment Processing

Ensure a payment is only processed once:

```typescript
const paymentQueue = new Queue('payments', {
  distributedLock: true,
  maxStalledJobRetries: 0  // Don't auto-retry payments
})

paymentQueue.process(1, async (job) => {
  const { paymentId, amount, userId } = job.data

  // Safe to process - distributed lock ensures exclusivity
  await processPayment(paymentId, amount, userId)

  return { processed: true, paymentId }
})
```

### Inventory Updates

Prevent race conditions in inventory management:

```typescript
const inventoryQueue = new Queue('inventory', {
  distributedLock: true
})

inventoryQueue.process(5, async (job) => {
  const { productId, quantity, operation } = job.data

  // Lock ensures atomic inventory updates
  if (operation === 'decrement') {
    await decrementInventory(productId, quantity)
  } else {
    await incrementInventory(productId, quantity)
  }

  return { updated: true }
})
```

### Singleton Jobs

Ensure only one instance of a job runs at a time:

```typescript
const maintenanceQueue = new Queue('maintenance', {
  distributedLock: true,
  horizontalScaling: {
    enabled: true,
    leaderElection: {
      heartbeatInterval: 5000,
      leaderTimeout: 15000
    }
  }
})

// Add a unique maintenance job
await maintenanceQueue.add(
  { task: 'cleanup-old-sessions' },
  { jobId: 'daily-cleanup' }  // Same ID ensures only one job
)
```

## Best Practices

1. **Enable for Critical Operations**: Use distributed locks for payment, inventory, and other critical operations
2. **Configure Stalled Job Handling**: Set appropriate intervals and retry limits
3. **Use Leader Election**: For scheduled tasks that should only run on one instance
4. **Monitor Lock Acquisition**: Track lock contention and failures
5. **Handle Lock Failures Gracefully**: Jobs that can't acquire locks should be retried later

## Next Steps

- Set up [cron jobs](./cron-jobs.md)
- Configure [dead letter queues](./dead-letter-queue.md)
- Learn about [rate limiting](./rate-limiting.md)
