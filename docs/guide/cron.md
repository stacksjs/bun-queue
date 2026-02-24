---
title: Cron Jobs
description: Schedule recurring jobs using cron expressions in bun-queue
---

# Cron Jobs

Schedule recurring jobs using standard cron expressions. This guide covers cron syntax, scheduling patterns, and managing scheduled jobs.

## Overview

Cron jobs in bun-queue allow you to:

- Schedule jobs to run at specific times
- Use standard cron expression syntax
- Set timezone-aware schedules
- Limit job execution count
- Configure start and end dates

## Basic Usage

### Using CronScheduler

```typescript
import { Queue, CronScheduler } from 'bun-queue'

const queue = new Queue('scheduled-tasks')
const scheduler = new CronScheduler(queue)

// Schedule a job to run every hour
await scheduler.schedule({
  cronExpression: '0 * * * *',
  data: { task: 'hourly-cleanup' },
})
```

### Using Repeat Options

Alternatively, use the `repeat` option when adding jobs:

```typescript
await queue.add(
  { task: 'daily-report' },
  {
    repeat: {
      cron: '0 9 * * *', // Every day at 9 AM
    },
  }
)
```

## Cron Expression Syntax

Cron expressions have 5 fields:

```
*    *    *    *    *
|    |    |    |    |
|    |    |    |    +--- Day of week (0-6, Sunday=0)
|    |    |    +-------- Month (1-12)
|    |    +------------- Day of month (1-31)
|    +------------------ Hour (0-23)
+----------------------- Minute (0-59)
```

### Common Patterns

```typescript
// Every minute
'* * * * *'

// Every hour (at minute 0)
'0 * * * *'

// Every day at midnight
'0 0 * * *'

// Every day at 9 AM
'0 9 * * *'

// Every Monday at 9 AM
'0 9 * * 1'

// Every 15 minutes
'*/15 * * * *'

// Every weekday at 6 PM
'0 18 * * 1-5'

// First day of every month at midnight
'0 0 1 * *'

// Every hour from 9 AM to 5 PM
'0 9-17 * * *'
```

### Syntax Examples

| Expression | Description |
|------------|-------------|
| `*` | Every unit |
| `5` | At exactly 5 |
| `*/5` | Every 5 units |
| `1-5` | From 1 to 5 |
| `1,3,5` | At 1, 3, and 5 |
| `1-5/2` | Every 2nd from 1 to 5 (1, 3, 5) |

## CronScheduler API

### Schedule a Job

```typescript
import { Queue, CronScheduler } from 'bun-queue'

const queue = new Queue('tasks')
const scheduler = new CronScheduler(queue)

const jobId = await scheduler.schedule({
  // Required: cron expression
  cronExpression: '0 */2 * * *', // Every 2 hours

  // Required: job data
  data: {
    task: 'sync-data',
    source: 'api',
  },

  // Optional: timezone
  timezone: 'America/New_York',

  // Optional: start date
  startDate: new Date('2024-01-01'),

  // Optional: end date
  endDate: new Date('2024-12-31'),

  // Optional: max executions
  limit: 100,

  // Optional: job options
  priority: 5,
  attempts: 3,
})

console.log(`Scheduled job: ${jobId}`)
```

### Unschedule a Job

```typescript
const success = await scheduler.unschedule(jobId)
console.log(success ? 'Unscheduled' : 'Job not found')
```

## Timezone Support

Schedule jobs in a specific timezone:

```typescript
await scheduler.schedule({
  cronExpression: '0 9 * * *', // 9 AM
  timezone: 'America/Los_Angeles', // Pacific Time
  data: { task: 'morning-report' },
})

await scheduler.schedule({
  cronExpression: '0 9 * * *', // 9 AM
  timezone: 'Europe/London', // UK Time
  data: { task: 'morning-report' },
})
```

Common timezones:

- `America/New_York` (Eastern)
- `America/Chicago` (Central)
- `America/Denver` (Mountain)
- `America/Los_Angeles` (Pacific)
- `Europe/London`
- `Europe/Paris`
- `Asia/Tokyo`
- `Australia/Sydney`
- `UTC`

## Limiting Executions

### Maximum Executions

```typescript
await scheduler.schedule({
  cronExpression: '0 * * * *',
  data: { task: 'limited-task' },
  limit: 24, // Run at most 24 times
})
```

### Date Range

```typescript
// Run only during Q1 2024
await scheduler.schedule({
  cronExpression: '0 9 * * 1', // Every Monday at 9 AM
  data: { task: 'weekly-report' },
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-03-31'),
})
```

## Repeat Options

When adding jobs directly with repeat options:

```typescript
await queue.add(
  { task: 'recurring' },
  {
    repeat: {
      // Interval-based (ms)
      every: 60000, // Every minute

      // Or cron-based
      cron: '0 * * * *',

      // Timezone
      tz: 'UTC',

      // Limit
      limit: 100,

      // Date range
      startDate: new Date(),
      endDate: new Date('2024-12-31'),
    },
  }
)
```

## Use Cases

### Daily Database Cleanup

```typescript
await scheduler.schedule({
  cronExpression: '0 3 * * *', // 3 AM daily
  data: {
    task: 'db-cleanup',
    tables: ['sessions', 'temp_data', 'logs'],
    olderThanDays: 30,
  },
  timezone: 'UTC',
})

queue.process(1, async (job) => {
  if (job.data.task === 'db-cleanup') {
    for (const table of job.data.tables) {
      await cleanupTable(table, job.data.olderThanDays)
    }
  }
})
```

### Hourly Metrics Collection

```typescript
await scheduler.schedule({
  cronExpression: '0 * * * *', // Every hour
  data: {
    task: 'collect-metrics',
    sources: ['api', 'database', 'cache'],
  },
})

queue.process(1, async (job) => {
  const metrics = await collectMetrics(job.data.sources)
  await storeMetrics(metrics)
})
```

### Weekly Report Generation

```typescript
await scheduler.schedule({
  cronExpression: '0 9 * * 1', // Monday 9 AM
  timezone: 'America/New_York',
  data: {
    task: 'weekly-report',
    recipients: ['team@company.com'],
  },
})
```

### Business Hours Processing

```typescript
// Every 30 minutes during business hours (9 AM - 5 PM, Mon-Fri)
await scheduler.schedule({
  cronExpression: '0,30 9-17 * * 1-5',
  timezone: 'America/Chicago',
  data: { task: 'process-orders' },
})
```

### End of Month Tasks

```typescript
// Last day of month at 11:59 PM (approximate - runs on the 28th)
await scheduler.schedule({
  cronExpression: '59 23 28 * *',
  data: { task: 'monthly-billing' },
})

// Better: Run on first of month for previous month
await scheduler.schedule({
  cronExpression: '0 1 1 * *', // 1 AM on the 1st
  data: {
    task: 'monthly-billing',
    forPreviousMonth: true,
  },
})
```

## Managing Scheduled Jobs

### List All Scheduled Jobs

```typescript
// Get delayed jobs (includes scheduled)
const scheduledJobs = await queue.getJobs('delayed')

for (const job of scheduledJobs) {
  if (job.opts.repeat) {
    console.log(`Scheduled: ${job.id}`)
    console.log(`  Cron: ${job.opts.repeat.cron}`)
    console.log(`  Next run: ${new Date(job.timestamp + job.delay)}`)
  }
}
```

### Cancel a Scheduled Job

```typescript
// Using scheduler
await scheduler.unschedule(jobId)

// Or directly
const job = await queue.getJob(jobId)
if (job) {
  await job.remove()
}
```

### Update a Schedule

```typescript
// Remove old schedule and create new one
await scheduler.unschedule(oldJobId)

const newJobId = await scheduler.schedule({
  cronExpression: '0 */4 * * *', // Changed to every 4 hours
  data: { task: 'sync-data' },
})
```

## Error Handling

### Retry Failed Scheduled Jobs

```typescript
queue.process(1, async (job) => {
  try {
    await performScheduledTask(job.data)
  } catch (error) {
    console.error(`Scheduled task failed: ${error.message}`)
    throw error // Will retry based on job options
  }
})

// Configure retries for scheduled jobs
await scheduler.schedule({
  cronExpression: '0 * * * *',
  data: { task: 'important-sync' },
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
})
```

### Monitor Scheduled Job Health

```typescript
// Track scheduled job executions
let scheduledRuns = 0
let scheduledFailures = 0

queue.on('jobCompleted', (jobId, result) => {
  scheduledRuns++
})

queue.on('jobFailed', (jobId, error) => {
  scheduledFailures++
  alerting.warn(`Scheduled job failed: ${jobId}`)
})

// Report health periodically
setInterval(() => {
  console.log({
    scheduled: {
      runs: scheduledRuns,
      failures: scheduledFailures,
      successRate: scheduledRuns / (scheduledRuns + scheduledFailures),
    },
  })
}, 300000) // Every 5 minutes
```

## Testing Cron Jobs

### Calculate Next Execution

```typescript
// For testing, calculate when job will run next
function getNextCronExecution(cron: string, fromDate = new Date()) {
  // Use scheduler's internal parsing
  const scheduler = new CronScheduler(queue)
  // ... (see implementation)
}
```

### Test with Short Intervals

```typescript
// For testing, use minute-based cron
await scheduler.schedule({
  cronExpression: '* * * * *', // Every minute for testing
  data: { task: 'test-task' },
  limit: 5, // Stop after 5 runs
})
```

## Best Practices

### 1. Use Descriptive Job IDs

```typescript
await scheduler.schedule({
  cronExpression: '0 9 * * *',
  data: { task: 'daily-sync' },
  jobId: 'cron-daily-sync-9am', // Descriptive ID
})
```

### 2. Include Metadata

```typescript
await scheduler.schedule({
  cronExpression: '0 */6 * * *',
  data: {
    task: 'cleanup',
    meta: {
      scheduled: true,
      cron: '0 */6 * * *',
      description: 'Cleanup old data every 6 hours',
    },
  },
})
```

### 3. Handle Overlapping Executions

```typescript
import { DistributedLock } from 'bun-queue'

queue.process(1, async (job) => {
  const lock = new DistributedLock(queue)

  const acquired = await lock.acquire(`task:${job.data.task}`, {
    ttl: 300000, // 5 minutes
  })

  if (!acquired) {
    console.log('Previous execution still running, skipping')
    return { skipped: true }
  }

  try {
    return await performTask(job.data)
  } finally {
    await lock.release(`task:${job.data.task}`)
  }
})
```

### 4. Log Scheduled Executions

```typescript
queue.process(1, async (job) => {
  const startTime = Date.now()

  console.log({
    event: 'scheduled_job_start',
    jobId: job.id,
    task: job.data.task,
    scheduledFor: new Date(job.timestamp),
    actualStart: new Date(startTime),
    delay: startTime - job.timestamp,
  })

  const result = await performTask(job.data)

  console.log({
    event: 'scheduled_job_complete',
    jobId: job.id,
    duration: Date.now() - startTime,
  })

  return result
})
```

## Next Steps

- Learn about [Failed Job Handling](/guide/failed)
- Explore [Priority Queues](/priority-queues)
- Configure [Rate Limiting](/rate-limiting)
