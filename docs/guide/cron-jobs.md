# Cron Jobs

Learn how to schedule recurring jobs using cron expressions or fixed intervals.

## Overview

bun-queue supports scheduling recurring jobs that run automatically at specified intervals or times. This is perfect for periodic tasks like sending daily reports, cleaning up old data, or syncing with external services.

## Scheduling with Intervals

Schedule jobs to repeat at fixed intervals:

```typescript
import { Queue } from 'bun-queue'

const queue = new Queue('scheduled-tasks')

// Run every 5 minutes
await queue.add(
  { task: 'sync-data' },
  {
    repeat: {
      every: 5 * 60 * 1000 // 5 minutes in milliseconds
    }
  }
)
```

## Scheduling with Cron Expressions

Use cron expressions for complex schedules:

```typescript
// Run at midnight every day
await queue.add(
  { task: 'daily-report' },
  {
    repeat: {
      cron: '0 0 * * *'
    }
  }
)

// Run every Monday at 9 AM
await queue.add(
  { task: 'weekly-summary' },
  {
    repeat: {
      cron: '0 9 * * 1'
    }
  }
)

// Run every hour
await queue.add(
  { task: 'hourly-cleanup' },
  {
    repeat: {
      cron: '0 * * * *'
    }
  }
)
```

## Cron Expression Format

```
 ┌───────────── minute (0 - 59)
 │ ┌───────────── hour (0 - 23)
 │ │ ┌───────────── day of month (1 - 31)
 │ │ │ ┌───────────── month (1 - 12)
 │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
 │ │ │ │ │
 * * * * *
```

### Common Cron Expressions

| Expression | Description |
|------------|-------------|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Daily at midnight |
| `0 0 * * 0` | Weekly on Sunday at midnight |
| `0 0 1 * *` | Monthly on the 1st at midnight |
| `0 9 * * 1-5` | Weekdays at 9 AM |
| `*/5 * * * *` | Every 5 minutes |
| `0 */2 * * *` | Every 2 hours |

## Repeat Options

```typescript
interface RepeatOptions {
  every: number              // Interval in milliseconds
  limit?: number             // Maximum number of repetitions
  count?: number             // Current repetition count
  cron?: string              // Cron expression
  tz?: string                // Timezone (e.g., 'America/New_York')
  startDate?: Date | number  // Start date for the schedule
  endDate?: Date | number    // End date for the schedule
}
```

## Timezone Support

Schedule jobs in specific timezones:

```typescript
// Run at 9 AM New York time, not UTC
await queue.add(
  { task: 'market-open-alert' },
  {
    repeat: {
      cron: '0 9 * * 1-5',
      tz: 'America/New_York'
    }
  }
)

// Run at midnight Tokyo time
await queue.add(
  { task: 'japan-daily-report' },
  {
    repeat: {
      cron: '0 0 * * *',
      tz: 'Asia/Tokyo'
    }
  }
)
```

## Limiting Repetitions

Set a maximum number of repetitions:

```typescript
// Run 10 times then stop
await queue.add(
  { task: 'limited-task' },
  {
    repeat: {
      every: 60000,  // Every minute
      limit: 10      // Run only 10 times
    }
  }
)
```

## Date Range

Schedule jobs within a specific date range:

```typescript
const startDate = new Date('2024-12-01')
const endDate = new Date('2024-12-31')

// Run daily during December only
await queue.add(
  { task: 'holiday-promotion' },
  {
    repeat: {
      cron: '0 10 * * *',
      startDate,
      endDate
    }
  }
)
```

## Examples

### Daily Email Digest

```typescript
const emailQueue = new Queue('emails')

await emailQueue.add(
  { type: 'daily-digest' },
  {
    repeat: {
      cron: '0 8 * * *',  // 8 AM daily
      tz: 'UTC'
    },
    jobId: 'daily-digest'  // Unique ID prevents duplicates
  }
)

emailQueue.process(1, async (job) => {
  if (job.data.type === 'daily-digest') {
    const users = await getActiveUsers()
    for (const user of users) {
      await sendDigestEmail(user)
    }
  }
})
```

### Hourly Data Sync

```typescript
const syncQueue = new Queue('data-sync')

await syncQueue.add(
  { source: 'external-api' },
  {
    repeat: {
      cron: '0 * * * *'  // Every hour
    },
    jobId: 'hourly-sync'
  }
)
```

### Weekly Cleanup

```typescript
const maintenanceQueue = new Queue('maintenance')

await maintenanceQueue.add(
  { task: 'cleanup-sessions' },
  {
    repeat: {
      cron: '0 3 * * 0',  // Sunday at 3 AM
      tz: 'UTC'
    },
    jobId: 'weekly-cleanup'
  }
)
```

### Business Hours Only

```typescript
const alertQueue = new Queue('alerts')

await alertQueue.add(
  { type: 'health-check' },
  {
    repeat: {
      cron: '*/15 9-17 * * 1-5',  // Every 15 min, 9-5 on weekdays
      tz: 'America/New_York'
    },
    jobId: 'business-hours-health-check'
  }
)
```

## Best Practices

1. **Use Unique Job IDs**: Prevent duplicate scheduled jobs with `jobId`
2. **Set Appropriate Intervals**: Don't schedule jobs more frequently than needed
3. **Use Leader Election**: For horizontally scaled apps, ensure only one instance runs scheduled jobs
4. **Handle Failures Gracefully**: Scheduled jobs should handle failures without blocking future runs
5. **Monitor Execution**: Track scheduled job execution to ensure they're running as expected

## Next Steps

- Configure [dead letter queues](./dead-letter-queue.md)
- Learn about [distributed locks](./distributed-locks.md)
- Set up [rate limiting](./rate-limiting.md)
