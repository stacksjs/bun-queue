# Introduction

bun-queue is a fast, reliable, and type-safe Redis-backed job queue built specifically for Bun. It's inspired by Laravel's Queue system and BullMQ, bringing the best of both worlds to the TypeScript ecosystem.

## Why bun-queue?

- **Built for Bun**: Optimized specifically for Bun's runtime
- **Redis-backed**: Reliable job persistence with Redis for distributed processing
- **Type-safe**: Full TypeScript support with type inference
- **Feature-rich**: Priority queues, cron jobs, dead letter queues, and more
- **Easy to use**: Simple API inspired by Laravel's elegant queue system

## Core Features

### Job Queue Basics
- Add jobs with customizable options (delays, retries, priority)
- Process jobs with configurable concurrency
- Track job progress during execution
- Automatic retry with exponential backoff

### Priority Queues
Process jobs based on importance with multiple priority levels, ensuring critical tasks are handled first.

### Cron Jobs
Schedule recurring jobs using standard cron expressions with timezone support and execution limits.

### Dead Letter Queues
Automatically capture permanently failed jobs for inspection and reprocessing.

### Horizontal Scaling
Scale across multiple instances with built-in leader election and work coordination.

## Quick Example

```typescript
import { Queue } from 'bun-queue'

// Create a queue
const emailQueue = new Queue('emails')

// Add a job
await emailQueue.add({
  to: 'user@example.com',
  subject: 'Welcome!',
  body: 'Thanks for joining us.'
})

// Process jobs
emailQueue.process(5, async (job) => {
  await sendEmail(job.data)
  return { sent: true }
})
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Producer                            │
│    (Your application adding jobs to the queue)          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                       Redis                              │
│    (Persistent storage for jobs and queue state)        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                      Workers                             │
│    (Multiple processes consuming and processing jobs)   │
└─────────────────────────────────────────────────────────┘
```

## Next Steps

- [Installation](/install) - Get started with bun-queue
- [Creating Jobs](/creating-jobs) - Learn how to add jobs to the queue
- [Workers](/workers) - Process jobs with workers
- [Priority Queues](/priority-queues) - Process jobs by importance
- [Cron Jobs](/cron-jobs) - Schedule recurring jobs

## Changelog

Please see our [releases](https://github.com/stacksjs/bun-queue/releases) page for more information on what has changed recently.

## Contributing

Please review the [Contributing Guide](https://github.com/stacksjs/contributing) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/bun-queue/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## License

The MIT License (MIT). Please see [LICENSE](https://github.com/stacksjs/bun-queue/tree/main/LICENSE.md) for more information.

Made with love by the Stacks.js team.
