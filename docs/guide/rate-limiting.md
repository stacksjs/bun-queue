# Rate Limiting

Learn how to control the rate at which jobs are processed to prevent overwhelming external services or resources.

## Overview

Rate limiting allows you to control how many jobs are processed within a given time window. This is essential when working with external APIs that have rate limits or when you need to protect your own resources.

## Basic Rate Limiting

Configure rate limiting when creating a queue:

```typescript
import { Queue, RateLimiter } from 'bun-queue'

const queue = new Queue('api-calls')

// Create a rate limiter (100 jobs per minute)
const limiter = new RateLimiter(queue, {
  max: 100,
  duration: 60000 // milliseconds
})
```

## Rate Limiter Options

```typescript
interface RateLimiter {
  max: number                  // Maximum number of jobs
  duration: number             // Time window in milliseconds
  keyPrefix?: string | ((data: any) => string)  // Per-key rate limiting
}
```

## Checking Rate Limits

Before adding a job, check if the rate limit has been exceeded:

```typescript
const { limited, remaining, resetIn } = await limiter.check()

if (!limited) {
  await queue.add({ url: 'https://api.example.com/endpoint' })
  console.log(`Job added. ${remaining} requests remaining.`)
} else {
  console.log(`Rate limited. Try again in ${resetIn}ms.`)
}
```

## Rate Limit Result

The `check()` method returns:

```typescript
interface RateLimitResult {
  limited: boolean    // Whether the rate limit has been exceeded
  remaining: number   // Number of jobs remaining in the window
  resetIn: number     // Milliseconds until the window resets
}
```

## Per-Key Rate Limiting

Rate limit based on specific keys (e.g., per user or per API endpoint):

```typescript
const queue = new Queue('api-calls', {
  limiter: {
    max: 10,
    duration: 60000,
    keyPrefix: 'userId' // Use userId from job data as the key
  }
})

// Each user is limited to 10 requests per minute
await queue.add({ userId: 'user-1', action: 'fetch' })
await queue.add({ userId: 'user-2', action: 'fetch' })
```

### Dynamic Key Generation

Use a function to generate rate limit keys:

```typescript
const queue = new Queue('api-calls', {
  limiter: {
    max: 100,
    duration: 60000,
    keyPrefix: (data) => `${data.tenantId}:${data.endpoint}`
  }
})

// Rate limit per tenant per endpoint
await queue.add({
  tenantId: 'tenant-1',
  endpoint: '/users',
  method: 'GET'
})
```

## Check by Key

Check rate limits for a specific key:

```typescript
const limiter = new RateLimiter(queue, {
  max: 10,
  duration: 60000
})

// Check rate limit for a specific user
const result = await limiter.checkByKey('user-123')

if (!result.limited) {
  // Proceed with operation
}
```

## Examples

### API Rate Limiting

```typescript
const apiQueue = new Queue('external-api', {
  limiter: {
    max: 1000,
    duration: 3600000 // 1000 requests per hour
  }
})

async function callExternalApi(endpoint: string, data: any) {
  const limiter = new RateLimiter(apiQueue, apiQueue.options.limiter)
  const { limited, remaining, resetIn } = await limiter.check()

  if (limited) {
    throw new Error(`Rate limited. Reset in ${Math.ceil(resetIn / 1000)}s`)
  }

  await apiQueue.add({ endpoint, data })
  console.log(`API call queued. ${remaining} calls remaining this hour.`)
}
```

### Per-User Email Rate Limiting

```typescript
const emailQueue = new Queue('emails', {
  limiter: {
    max: 5,
    duration: 3600000, // 5 emails per hour per user
    keyPrefix: 'recipientId'
  }
})

async function sendEmail(recipientId: string, subject: string, body: string) {
  const limiter = new RateLimiter(emailQueue, emailQueue.options.limiter)
  const result = await limiter.checkByKey(recipientId)

  if (result.limited) {
    console.log(`User ${recipientId} has received too many emails`)
    return false
  }

  await emailQueue.add({ recipientId, subject, body })
  return true
}
```

### Multi-Tenant Rate Limiting

```typescript
const requestQueue = new Queue('requests', {
  limiter: {
    max: 1000,
    duration: 60000,
    keyPrefix: (data) => data.tenantId
  }
})

// Each tenant gets 1000 requests per minute
await requestQueue.add({
  tenantId: 'acme-corp',
  action: 'process'
})
```

## Best Practices

1. **Set Appropriate Limits**: Match your rate limits to external API limits with some buffer
2. **Use Per-Key Limiting**: For multi-user systems, rate limit per user or tenant
3. **Handle Rate Limit Errors**: Implement proper error handling when rate limited
4. **Monitor Usage**: Track rate limit hits to understand usage patterns
5. **Combine with Backoff**: Use exponential backoff when rate limited

## Next Steps

- Configure [distributed locks](./distributed-locks.md)
- Set up [cron jobs](./cron-jobs.md)
- Learn about [dead letter queues](./dead-letter-queue.md)
