# Cron Expressions Guide

`bun-queue` supports native cron syntax for scheduling recurring jobs with timezone support. This guide helps you understand how to write cron expressions and provides common examples you can use in your applications.

## Cron Expression Format

A cron expression consists of five fields that specify when a job should run:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### Special Characters

- `*`: Matches any value (wildcard)
- `,`: Separates multiple values (e.g., `1,3,5`)
- `-`: Specifies a range (e.g., `1-5`)
- `/`: Specifies a step value (e.g., `*/2` means every 2 units)

## Common Cron Expressions

Here are some commonly used cron expressions:

| Expression | Description |
|------------|-------------|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour (at minute 0) |
| `0 0 * * *` | Every day at midnight |
| `0 0 * * 0` | Every Sunday at midnight |
| `0 0 1 * *` | First day of every month at midnight |
| `0 0 1 1 *` | January 1st at midnight (once a year) |
| `0 12 * * 1-5` | Every weekday at noon |
| `0 */2 * * *` | Every 2 hours |
| `*/15 * * * *` | Every 15 minutes |
| `0 8-17 * * 1-5` | Every hour from 8am to 5pm on weekdays |
| `0 9 * * 1` | Every Monday at 9am |

## Timezone Support

Bun Bull supports timezone specifications for cron jobs. This allows you to schedule jobs according to a specific timezone rather than server time.

Example with timezone:

```typescript
await queue.scheduleCron({
  cronExpression: '30 9 * * *', // Every day at 9:30am
  timezone: 'America/New_York', // Eastern Time
  data: {
    // job data
  }
})
```

### Common Timezones

- `UTC`: Coordinated Universal Time
- `America/New_York`: Eastern Time (US & Canada)
- `America/Chicago`: Central Time (US & Canada)
- `America/Denver`: Mountain Time (US & Canada)
- `America/Los_Angeles`: Pacific Time (US & Canada)
- `Europe/London`: UK time
- `Europe/Paris`: Central European Time
- `Asia/Tokyo`: Japan Standard Time
- `Australia/Sydney`: Australian Eastern Time

## Advanced Examples

### First Monday of the Month

To schedule a job to run on the first Monday of each month:

```
0 12 1-7 * 1
```

This runs at 12:00pm on Mondays (day of week = 1) that occur between the 1st and 7th day of the month.

### Last Day of the Month

This is trickier and is not directly supported by cron syntax. Instead, you might need to:

1. Schedule a daily job
2. Check in your job handler if it's the last day of the month

### Specific Complex Schedules

For more complex scheduling needs, you might need to combine multiple cron expressions or use custom logic in your job handler.

## Using Cron Jobs in Bun Bull

```typescript
import type { CronJobOptions } from 'bun-queue'
import { Queue } from 'bun-queue'

// Create a queue
const queue = new Queue('my-queue')

// Schedule a cron job
await queue.scheduleCron({
  cronExpression: '0 0 * * *', // Daily at midnight
  timezone: 'UTC',
  data: {
    // Your job data
  },
  // Other job options
  limit: 30, // Run at most 30 times
  jobId: 'daily-job' // Custom job ID
})

// Unschedule a cron job
await queue.unscheduleCron('daily-job')
```

## Best Practices

1. **Be specific**: Avoid using `* * * * *` (every minute) in production as it can overload your system.
2. **Use jobId**: Always provide a jobId for cron jobs so you can easily unschedule them later.
3. **Test timezone logic**: If using timezones, test to ensure jobs run at the expected time.
4. **Set limits**: Consider using the `limit` option to ensure jobs don't run indefinitely.
5. **Handle edge cases**: Be aware of edge cases like months with varying numbers of days.

## Additional Resources

- [Crontab Guru](https://crontab.guru/): Interactive cron expression editor
- [List of TZ database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones): Complete list of valid timezone identifiers
