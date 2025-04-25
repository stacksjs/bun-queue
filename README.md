<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# bun-queue

A Redis-backed job queue built for Bun, inspired by Laravel's Queue system and BullMQ.

## Features

- Fast and efficient Redis-backed queue system
- Support for delayed jobs, retries, and prioritization
- Rate limiting capabilities
- Job event tracking
- Reliable job processing with concurrency control
- Typesafe API

## Installation

```bash
bun add bun-queue
```

## Basic Usage

```typescript
import { Queue } from 'bun-queue'

// Create a queue
const emailQueue = new Queue('emails')

// Add a job to the queue
const job = await emailQueue.add({
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Welcome to our platform!'
})

console.log(`Job ${job.id} added to the queue`)

// Process jobs
emailQueue.process(5, async (job) => {
  const { to, subject, body } = job.data

  // Update progress
  await job.updateProgress(10)

  // Simulate sending email
  console.log(`Sending email to ${to} with subject: ${subject}`)
  await new Promise(resolve => setTimeout(resolve, 1000))

  await job.updateProgress(100)

  return { sent: true, timestamp: Date.now() }
})
```

## Job Options

```typescript
// Add a job with options
await queue.add(
  { task: 'process-pdf', url: 'https://example.com/document.pdf' },
  {
    delay: 5000, // delay for 5 seconds
    attempts: 3, // retry up to 3 times
    backoff: {
      type: 'exponential', // 'fixed' or 'exponential'
      delay: 1000, // milliseconds
    },
    priority: 10, // higher number = higher priority
    removeOnComplete: true, // remove job when completed
    lifo: false, // process in FIFO order (default)
    jobId: 'custom-id', // provide custom job ID
  }
)
```

## Delayed Jobs

```typescript
// Add a job that will be processed after 30 seconds
await queue.add(
  { task: 'send-reminder' },
  { delay: 30000 }
)
```

## Job Management

```typescript
// Get a job by ID
const job = await queue.getJob('job-id')

// Get jobs by status
const waitingJobs = await queue.getJobs('waiting')
const activeJobs = await queue.getJobs('active')
const completedJobs = await queue.getJobs('completed')
const failedJobs = await queue.getJobs('failed')

// Get job counts
const counts = await queue.getJobCounts()
console.log(counts) // { waiting: 5, active: 2, completed: 10, failed: 1, delayed: 3, paused: 0 }

// Pause a queue
await queue.pause()

// Resume a queue
await queue.resume()

// Retry a failed job
const failedJob = await queue.getJob('failed-job-id')
await failedJob.retry()

// Remove a job
await job.remove()

// Clear all jobs
await queue.empty()
```

## Rate Limiting

```typescript
import { Queue, RateLimiter } from 'bun-queue'

const queue = new Queue('api-calls')

// Create a rate limiter (100 jobs per minute)
const limiter = new RateLimiter(queue, {
  max: 100,
  duration: 60000
})

// Check if rate limited before adding job
const { limited, remaining, resetIn } = await limiter.check()

if (!limited) {
  await queue.add({ url: 'https://api.example.com/endpoint' })
  console.log(`Job added. ${remaining} requests remaining.`)
}
else {
  console.log(`Rate limited. Try again in ${resetIn}ms.`)
}
```

## Configuration

```typescript
import { Queue } from 'bun-queue'

// Configure queue with options
const queue = new Queue('tasks', {
  redis: {
    url: 'redis://username:password@localhost:6379'
    // Or provide your own client
    // client: myRedisClient
  },
  prefix: 'myapp', // prefix for Redis keys (default: 'queue')
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  }
})
```

## Environment Variables

The library reads these environment variables (in order of precedence):

- `REDIS_URL`: Redis connection string
- Default is `redis://localhost:6379` if not set

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stackjs/bun-queue/releases) page for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/bun-queue/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

"Software that is free, but hopes for a postcard." We love receiving postcards from around the world showing where Stacks is being used! We showcase them on our website too.

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/bun-queue?style=flat-square
[npm-version-href]: https://npmjs.com/package/bun-queue
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/bun-queue/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/bun-queue/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/bun-queue/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/bun-queue -->
