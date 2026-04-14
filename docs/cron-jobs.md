---
title: Cron Jobs
description: Schedule recurring jobs using cron expressions.
---
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
  timezone: 'America/New*York',
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
    tables: ['temp*data', 'expired_sessions']
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
