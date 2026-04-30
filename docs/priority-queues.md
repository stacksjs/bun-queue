---
title: Priority Queues
description: Learn how to use priority queues to process jobs in priority order.
---

Add emergency jobs that bypass the normal queue:

```typescript
// Normal processing
taskQueue.process(3, async (job) => {
  await processTask(job.data)
})

// Add emergency job with highest priority
setTimeout(async () => {
  console.log('Adding emergency task!')

  await taskQueue.add(
    { name: 'EMERGENCY TASK' },
    { priority: 9 }  // Highest priority
  )
}, 5000)
```

## Closing Priority Queues

Gracefully close the queue:

```typescript
// Stop processing and clean up
await taskQueue.close()
```

## Use Cases

### Customer Support Tickets

```typescript
const ticketQueue = new PriorityQueue('support-tickets', {
  levels: 4,
  defaultLevel: 1,
})

// VIP customer - high priority
await ticketQueue.add(
  { ticketId: 123, customerId: 'vip-001' },
  { priority: 3 }
)

// Regular customer - normal priority
await ticketQueue.add(
  { ticketId: 124, customerId: 'reg-001' },
  { priority: 1 }
)

// Critical system issue - highest priority
await ticketQueue.add(
  { ticketId: 125, type: 'system-down' },
  { priority: 3 }
)
```

### Email Processing

```typescript
const emailQueue = new PriorityQueue('emails', {
  levels: 3,
  defaultLevel: 1,
})

// Transactional emails - high priority
await emailQueue.add(
  { type: 'password-reset', to: 'user@example.com' },
  { priority: 2 }
)

// Order confirmations - normal priority
await emailQueue.add(
  { type: 'order-confirmation', to: 'user@example.com' },
  { priority: 1 }
)

// Newsletters - low priority
await emailQueue.add(
  { type: 'newsletter', to: 'user@example.com' },
  { priority: 0 }
)
```

### API Rate Limiting

```typescript
const apiQueue = new PriorityQueue('api-calls', {
  levels: 5,
  defaultLevel: 2,
})

// Premium users get higher priority
async function queueApiCall(userId: string, data: any) {
  const user = await getUser(userId)
  const priority = user.isPremium ? 4 : 2

  await apiQueue.add({ userId, data }, { priority })
}
```
