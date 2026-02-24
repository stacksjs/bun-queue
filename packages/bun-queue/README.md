# bun-queue

A Redis-backed job queue built for Bun.

## Installation

```bash
bun add @stacksjs/bun-queue
```

```bash
npm install @stacksjs/bun-queue
```

## Usage

```typescript
import { Queue } from '@stacksjs/bun-queue'

// Create a queue
const emailQueue = new Queue('emails')

// Add a job
const job = await emailQueue.add({
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Welcome to our platform!',
})

// Process jobs with concurrency
emailQueue.process(5, async (job) => {
  const { to, subject, body } = job.data
  await sendEmail(to, subject, body)
})
```

## Features

- **Redis-backed** - Reliable, persistent job storage
- **Delayed Jobs** - Schedule jobs to run at a future time
- **Retries** - Automatic retry with configurable backoff
- **Priority Queue** - Prioritize jobs for processing order
- **Rate Limiting** - Control job processing throughput
- **Concurrency Control** - Process multiple jobs in parallel
- **Job Events** - Track job lifecycle with event hooks
- **Dead Letter Queue** - Handle permanently failed jobs
- **Distributed Locks** - Prevent duplicate job processing
- **Cron Scheduling** - Schedule recurring jobs with cron expressions
- **Batch Processing** - Group and dispatch jobs as a batch
- **Middleware** - Compose job processing pipelines with built-in middleware
- **Worker Management** - Leader election and work coordination
- **Typesafe API** - Full TypeScript support

## License

MIT
