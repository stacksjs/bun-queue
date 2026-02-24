---
title: Cron Jobs
description: Schedule recurring jobs using cron expressions.
---

# Cron Jobs

bun-queue supports scheduling recurring jobs using standard cron expressions.

## Scheduling a Cron Job

```typescript
import { Queue } from 'bun-queue'

const notificationQueue = new Queue('notifications')

// Schedule a job to run every minute
const jobId = await notificationQueue.scheduleCron({
  cronExpression: '* * * * *',
  data: {
    title: 'Status Check',
    message: 'All systems operational'
  }
})

console.log(`Scheduled cron job: ${jobId}`)
```

## Cron Expression Format

Standard 5-field cron expression:

```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, 0=Sunday)
│ │ │ │ │
* * * * *
```

### Examples

```typescript
// Every minute
'* * * * *'

// Every hour at minute 0
'0 * * * *'

// Every day at 9:30 AM
'30 9 * * *'

// Every Monday at 8:00 AM
'0 8 * * 1'

// Every weekday (Monday-Friday) at 8:00 AM
'0 8 * * 1-5'

// First Monday of every month at 12:00 PM
'0 12 1-7 * 1'

// Every 5 minutes
'*/5 * * * *'

// Every 2 hours
'0 */2 * * *'
```

## Cron Job Options

```typescript
await queue.scheduleCron({
  // Required: Cron expression
  cronExpression: '0 * * * *',

  // Required: Job data
  data: { task: 'hourly-update' },

  // Optional: Custom job ID
  jobId: 'hourly-update-job',

  // Optional: Timezone (default: system timezone)
  timezone: 'America/New_York',

  // Optional: Maximum number of executions
  limit: 100,

  // Optional: Start date
  startDate: new Date('2024-01-01'),

  // Optional: End date
  endDate: new Date('2024-12-31'),

  // Optional: Job options
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 }
})
```

## Timezone Support

Schedule jobs in specific timezones:

```typescript
// Daily job at 9:30 AM London time
await queue.scheduleCron({
  cronExpression: '30 9 * * *',
  timezone: 'Europe/London',
  data: { task: 'daily-report' }
})

// Hourly job in Eastern Time
await queue.scheduleCron({
  cronExpression: '0 * * * *',
  timezone: 'America/New_York',
  data: { task: 'hourly-sync' }
})
```

## Limiting Executions

Limit the number of times a job runs:

```typescript
// Run only 5 times
await queue.scheduleCron({
  cronExpression: '* * * * *',
  data: { task: 'limited-task' },
  limit: 5
})
```

## Date Range Scheduling

Set start and end dates:

```typescript
await queue.scheduleCron({
  cronExpression: '0 9 * * 1-5',
  data: { task: 'weekday-briefing' },
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-06-30')
})
```

## Unscheduling Cron Jobs

Stop a scheduled cron job:

```typescript
// Schedule a cron job
const jobId = await queue.scheduleCron({
  cronExpression: '* * * * *',
  data: { task: 'test' },
  jobId: 'my-cron-job'
})

// Later, unschedule it
const success = await queue.unscheduleCron(jobId)

if (success) {
  console.log('Job unscheduled successfully')
}
```

## Processing Cron Jobs

Process cron jobs like regular jobs:

```typescript
const queue = new Queue('notifications')

// Schedule recurring job
await queue.scheduleCron({
  cronExpression: '0 * * * *',  // Every hour
  data: {
    title: 'Hourly Update',
    recipients: ['team@example.com']
  },
  jobId: 'hourly-update'
})

// Process the jobs
queue.process(5, async (job) => {
  const { title, recipients } = job.data

  for (const recipient of recipients) {
    await sendNotification(recipient, title)
  }

  return { sent: true }
})
```

## Practical Examples

### Status Check Every Minute

```typescript
await queue.scheduleCron({
  cronExpression: '* * * * *',
  data: { type: 'status-check' },
  jobId: 'status-check-minute',
  limit: 60  // Stop after 1 hour
})
```

### Daily Report

```typescript
await queue.scheduleCron({
  cronExpression: '30 9 * * *',  // 9:30 AM daily
  timezone: 'America/New_York',
  data: {
    type: 'daily-report',
    recipients: ['manager@example.com']
  },
  jobId: 'daily-report'
})
```

### Weekday Morning Briefing

```typescript
await queue.scheduleCron({
  cronExpression: '0 8 * * 1-5',  // 8 AM Monday-Friday
  data: {
    type: 'morning-briefing',
    channels: ['#general', '#team']
  },
  jobId: 'weekday-briefing'
})
```

### Monthly Review

```typescript
await queue.scheduleCron({
  cronExpression: '0 12 1-7 * 1',  // First Monday of month at noon
  data: {
    type: 'monthly-review',
    recipients: ['executives@example.com']
  },
  jobId: 'monthly-review'
})
```

### Database Cleanup

```typescript
await queue.scheduleCron({
  cronExpression: '0 3 * * *',  // 3 AM daily
  data: {
    type: 'db-cleanup',
    tables: ['temp_data', 'expired_sessions']
  },
  jobId: 'daily-cleanup'
})
```

## Monitoring Cron Jobs

```typescript
// Check if job is scheduled
const job = await queue.getJob('my-cron-job')

if (job) {
  console.log('Job data:', job.data)
  console.log('Next run delay:', job.delay)
  console.log('Repeat options:', job.opts.repeat)
}
```

## Error Handling

Configure retry behavior for failed cron jobs:

```typescript
await queue.scheduleCron({
  cronExpression: '0 * * * *',
  data: { task: 'important-task' },
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000
  }
})
```
