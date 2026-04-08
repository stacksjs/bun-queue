---
title: Priority Queues
description: Learn how to use priority queues to process jobs in priority order.
---

```typescript
  levels: 5,
  defaultLevel: 1,
})

// Map importance (1-10) to priority levels (0-4)
function getPriority(importance: number): number {
  return Math.min(Math.floor(importance / 2.5), 4)
}

// Add tasks with dynamic priority
const tasks = [
  { name: 'Low priority task', importance: 1 },
  { name: 'Medium priority task', importance: 5 },
  { name: 'High priority task', importance: 8 },
  { name: 'Critical task', importance: 10 },
]

for (const task of tasks) {
  await taskQueue.add(task, { priority: getPriority(task.importance) })
}
```

## Dynamic Reordering

Enable dynamic reordering to allow priority changes while jobs are waiting:

```typescript
const taskQueue = new PriorityQueue('tasks', {
  levels: 5,
  defaultLevel: 1,
  dynamicReordering: true,
  reorderInterval: 2000,  // Reorder every 2 seconds
})
```

## Priority Queue Configuration

Full configuration options:

```typescript
const taskQueue = new PriorityQueue('tasks', {
  // Priority settings
  levels: 10,            // Support 0-9 priority levels
  defaultLevel: 5,       // Default to middle priority
  dynamicReordering: true,
  reorderInterval: 5000,
}, {
  // Queue settings (same as regular Queue)
  redis: { url: 'redis://localhost:6379' },
  prefix: 'myapp',
  limiter: {
    max: 100,
    duration: 60000
  }
})
```

## Getting Job Counts

Get job counts across all priority levels:

```typescript
const counts = await taskQueue.getJobCounts()
console.log(counts)
// { waiting: 15, active: 3, completed: 100, failed: 2, delayed: 5, paused: 0 }
```

## Getting Jobs by Status

Retrieve jobs from all priority levels:

```typescript
// Get all waiting jobs (from all priority levels)
const waitingJobs = await taskQueue.getJobs('waiting')

for (const job of waitingJobs) {
  console.log(`Job ${job.id}: priority ${job.opts.priority}`)
}
```

## Emergency Priority Jobs

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
