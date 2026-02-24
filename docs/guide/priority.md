# Priority Queues

Learn how to prioritize jobs so that important tasks are processed first.

## Overview

bun-queue supports job prioritization, allowing you to ensure that high-priority jobs are processed before lower-priority ones. Higher priority values mean the job will be processed sooner.

## Basic Priority

Set job priority when adding to the queue:

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('tasks')

// Low priority job (default is 0)
await queue.add({ task: 'cleanup' }, { priority: 0 })

// Medium priority job
await queue.add({ task: 'notification' }, { priority: 5 })

// High priority job
await queue.add({ task: 'payment' }, { priority: 10 })
```

## Priority Levels

bun-queue supports up to 10 priority levels by default (0-9):

```typescript
// Priority constants
const DEFAULT_PRIORITY_LEVEL = 0
const MAX_PRIORITY_LEVELS = 10

// Example priority scheme
const Priority = {
  LOW: 0,
  NORMAL: 3,
  HIGH: 6,
  CRITICAL: 9
}

// Usage
await queue.add({ task: 'background-job' }, { priority: Priority.LOW })
await queue.add({ task: 'user-action' }, { priority: Priority.NORMAL })
await queue.add({ task: 'time-sensitive' }, { priority: Priority.HIGH })
await queue.add({ task: 'system-critical' }, { priority: Priority.CRITICAL })
```

## Priority Queue Options

Configure priority queue behavior:

```typescript
interface PriorityQueueOptions {
  levels?: number              // Number of priority levels (default: 10)
  defaultLevel?: number        // Default priority level (default: 0)
  dynamicReordering?: boolean  // Allow dynamic reordering
  reorderInterval?: number     // Reorder check interval in ms
}
```

## Processing Priority Jobs

Jobs are automatically processed in priority order:

```typescript
const queue = new Queue('orders')

// Add jobs with different priorities
await queue.add({ orderId: 1, type: 'regular' }, { priority: 1 })
await queue.add({ orderId: 2, type: 'express' }, { priority: 5 })
await queue.add({ orderId: 3, type: 'same-day' }, { priority: 8 })
await queue.add({ orderId: 4, type: 'standard' }, { priority: 0 })

// Process jobs - they will be processed in order: 3, 2, 1, 4
queue.process(1, async (job) => {
  console.log(`Processing order ${job.data.orderId} (${job.data.type})`)
  return { processed: true }
})
```

## Priority with Rate Limiting

Combine priority with rate limiting:

```typescript
import { Queue, RateLimiter } from 'bun-queue'

const queue = new Queue('api-calls', {
  limiter: {
    max: 100,
    duration: 60000 // 100 requests per minute
  }
})

// High priority API calls still respect rate limits
// but are processed first within the rate limit window
await queue.add({ endpoint: '/critical' }, { priority: 9 })
await queue.add({ endpoint: '/normal' }, { priority: 3 })
```

## Use Cases

### E-commerce Order Processing

```typescript
const orderQueue = new Queue('orders')

// VIP customers get higher priority
async function processOrder(order: Order) {
  const priority = order.customerType === 'vip' ? 8 :
                   order.customerType === 'premium' ? 5 : 2

  await orderQueue.add(order, { priority })
}
```

### Email Sending

```typescript
const emailQueue = new Queue('emails')

// Transactional emails have higher priority than marketing
await emailQueue.add(
  { type: 'password-reset', to: 'user@example.com' },
  { priority: 9 }  // Critical
)

await emailQueue.add(
  { type: 'newsletter', to: 'user@example.com' },
  { priority: 1 }  // Low priority
)
```

### Multi-tenant System

```typescript
const taskQueue = new Queue('tasks')

// Premium tenants get priority processing
async function addTenantTask(tenantId: string, task: any) {
  const tenant = await getTenant(tenantId)
  const priority = tenant.plan === 'enterprise' ? 8 :
                   tenant.plan === 'business' ? 5 : 2

  await taskQueue.add(
    { tenantId, ...task },
    { priority }
  )
}
```

## Best Practices

1. **Define Priority Levels**: Create constants for your priority levels to maintain consistency
2. **Don't Overuse High Priority**: If everything is high priority, nothing is
3. **Monitor Queue Distribution**: Track how jobs are distributed across priority levels
4. **Combine with Rate Limiting**: Priority doesn't bypass rate limits
5. **Consider Fairness**: Very low priority jobs might starve if high priority jobs keep coming

## Next Steps

- Learn about [rate limiting](./rate-limiting.md)
- Configure [distributed locks](./distributed-locks.md)
- Set up [dead letter queues](./dead-letter-queue.md)
