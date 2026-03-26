---
title: API Reference
description: Complete API reference for all bun-queue classes and methods.
---
|----------|------|-------------|
| `name` | `string` | Queue name |
| `prefix` | `string` | Redis key prefix |
| `redisClient` | `RedisClient` | Redis client instance |
| `keyPrefix` | `string` | Full key prefix (`prefix:name`) |
| `events` | `JobEvents` | Event emitter |

### Methods

#### Job Operations

```typescript
// Add a job to the queue
await queue.add(data: T, options?: JobOptions): Promise<Job<T>>

// Get a job by ID
await queue.getJob(jobId: string): Promise<Job<T> | null>

// Get jobs by status
await queue.getJobs(status: JobStatus, start?: number, end?: number): Promise<Job<T>[]>

// Get job counts for all statuses
await queue.getJobCounts(): Promise<Record<JobStatus, number>>

// Remove a job
await queue.removeJob(jobId: string): Promise<void>

// Bulk remove jobs
await queue.bulkRemove(jobIds: string[]): Promise<number>
```

#### Processing

```typescript
// Process jobs with handler and concurrency
queue.process(concurrency: number, handler: (job: Job<T>) => Promise<any>): void

// Process with distributed lock
await queue.processJobWithLock(jobId: string, handler: (job: Job<T>) => Promise<any>): Promise<any>
```

#### Queue Controls

```typescript
await queue.pause(): Promise<void>
await queue.resume(): Promise<void>
await queue.empty(): Promise<void>
await queue.close(): Promise<void>
await queue.ping(): Promise<boolean>

// Bulk operations
await queue.bulkPause(jobIds: string[]): Promise<number>
await queue.bulkResume(jobIds: string[]): Promise<number>
```

#### Rate Limiting

```typescript
await queue.isRateLimited(key?: string, data?: T): Promise<{ limited: boolean, resetIn: number }>
```

#### Cron Jobs

```typescript
await queue.scheduleCron(options: CronJobOptions): Promise<string>
await queue.unscheduleCron(jobId: string): Promise<boolean>
```

#### Dead Letter Queue

```typescript
queue.getDeadLetterQueue(): DeadLetterQueue<T>
queue.getDefaultDeadLetterOptions(): DeadLetterQueueOptions | undefined
await queue.moveToDeadLetter(jobId: string, reason: string): Promise<boolean>
await queue.getDeadLetterJobs(start?: number, end?: number): Promise<Job<T>[]>
await queue.republishDeadLetterJob(jobId: string, options?: { resetRetries?: boolean }): Promise<Job<T> | null>
await queue.removeDeadLetterJob(jobId: string): Promise<boolean>
await queue.clearDeadLetterQueue(): Promise<void>
```

#### Job Classes

```typescript
await queue.dispatchJob(job: JobContract, ...args: any[]): Promise<Job<any>>
queue.processJobs(concurrency?: number): void
await queue.addJobBatch(jobs: JobContract[], options?: { batchId?: string, allowFailures?: boolean }): Promise<Job<any>[]>
await queue.retryJob(jobId: string, newArgs?: any[]): Promise<Job<any> | null>
await queue.getFailedJobClasses(): Promise<Array<{ job, jobClass, error, failedAt }>>
await queue.getJobClassStats(): Promise<{ byClass, overall }>
await queue.clearJobClasses(): Promise<void>
await queue.pauseJobClasses(): Promise<void>
await queue.resumeJobClasses(): Promise<void>
```

#### Metrics & Scaling

```typescript
await queue.getMetrics(): Promise<QueueMetrics>
queue.getInstanceId(): string
queue.isLeader(): boolean
await queue.getLeaderId(): Promise<string | null>
await queue.getClusterInfo(): Promise<Record<string, any> | null>
queue.getLock(): DistributedLock | null
```

#### Key Helpers

```typescript
queue.getKey(name: string): string       // e.g. "queue:emails:waiting"
queue.getJobKey(jobId: string): string   // e.g. "queue:emails:abc123"
```

---

## Job

Represents a single job in the queue.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Job ID |
| `data` | `T` | Job payload |
| `name` | `string` | Queue name |
| `opts` | `JobOptions` | Job options |
| `progress` | `number` | Progress (0-100) |
| `delay` | `number` | Delay in ms |
| `timestamp` | `number` | Creation timestamp |
| `attemptsMade` | `number` | Number of attempts |
| `stacktrace` | `string[]` | Error stacktraces |
| `returnvalue` | `any` | Return value after completion |
| `finishedOn` | `number &#124; undefined` | Completion timestamp |
| `processedOn` | `number &#124; undefined` | Processing start timestamp |
| `failedReason` | `string &#124; undefined` | Failure reason |
| `dependencies` | `string[] &#124; undefined` | Dependency job IDs |

### Methods

```typescript
// Refresh job data from Redis
await job.refresh(): Promise<void>

// Update progress (0-100)
await job.updateProgress(progress: number): Promise<void>

// Move to completed
await job.moveToCompleted(returnvalue?: any): Promise<void>

// Move to failed
await job.moveToFailed(err: Error, failedReason?: string): Promise<void>

// Retry a failed job
await job.retry(): Promise<void>

// Remove the job
await job.remove(): Promise<void>
```

---

## JobBase

Abstract base class for class-based jobs.

```typescript
import { JobBase } from '@stacksjs/bun-queue'

class MyJob extends JobBase {
  queue = 'emails'
  tries = 3
  timeout = 30000
  backoff = [1000, 2000, 4000]

  async handle(...args: any[]) {
    // Your job logic
  }

  uniqueId(): string | undefined {
    return 'optional-unique-id'
  }
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `queue` | `string` | — | Target queue name |
| `connection` | `string` | — | Target connection |
| `delay` | `number` | `0` | Delay in ms |
| `tries` | `number` | `3` | Max attempts |
| `timeout` | `number` | — | Timeout in ms |
| `backoff` | `number[]` | — | Backoff delays |
| `maxExceptions` | `number` | — | Max exceptions |
| `middleware` | `JobMiddleware[]` | — | Middleware stack |
| `tags` | `string[]` | — | Job tags |
| `failOnTimeout` | `boolean` | — | Fail when timeout |

### Methods

```typescript
// Must implement
abstract handle(...args: any[]): Promise<any> | any

// Dispatch methods
await job.dispatch(...args): Promise<Job<any>>
await job.dispatchSync(...args): Promise<any>
await job.dispatchIf(condition, ...args): Promise<Job<any> | null>
await job.dispatchUnless(condition, ...args): Promise<Job<any> | null>
await job.dispatchAfter(delay, ...args): Promise<Job<any>>

// Fluent configuration
job.onQueue(queue: string): this
job.onConnection(connection: string): this
job.withDelay(delay: number): this
job.withTries(tries: number): this
job.withTimeout(timeout: number): this
job.withBackoff(backoff: number[]): this
job.withMiddleware(...middleware: JobMiddleware[]): this
job.withTags(...tags: string[]): this

// Job control (inside handle())
await job.fail(exception?: Error): Promise<void>
await job.release(delay?: number): Promise<void>
await job.delete(): Promise<void>
```

---

## Dispatch Functions

Standalone dispatch helpers.

```typescript
import {
  dispatch,
  dispatchSync,
  dispatchIf,
  dispatchUnless,
  dispatchAfter,
  dispatchChain,
  dispatchFunction,
  chain,
  batch,
} from '@stacksjs/bun-queue'

await dispatch(job)
await dispatchSync(job)
await dispatchIf(condition, job)
await dispatchUnless(condition, job)
await dispatchAfter(delay, job)
await dispatchChain([job1, job2, job3])
await dispatchFunction(fn, ...args)
```

### chain()

```typescript
const result = await chain(job)
  .onQueue('emails')
  .onConnection('redis')
  .delay(5000)
  .withTries(3)
  .withTimeout(30000)
  .withBackoff([1000, 2000])
  .withTags('urgent', 'email')
  .dispatch()
```

### batch()

```typescript
const result = await batch('my-batch')
  .add(job1)
  .add(job2)
  .addMany([job3, job4])
  .allowFailures()
  .withConcurrency(5)
  .withTimeout(60000)
  .onQueue('tasks')
  .dispatch()

// result: { jobs, results, errors, failedCount, successCount }
```

---

## BatchProcessor

Process groups of jobs together.

```typescript
import { BatchProcessor } from '@stacksjs/bun-queue'

const batchProc = new BatchProcessor(queue)
```

### Methods

```typescript
// Create a batch
await batchProc.createBatch(jobs: T[], options?: BatchOptions): Promise<Batch<T>>

// Process a batch
await batchProc.processBatch(batchId: string, handler: (jobs: Job<T>[]) => Promise<R[]>): Promise<R[]>

// Get batch info
await batchProc.getBatch(batchId: string): Promise<Batch<T> | null>
await batchProc.getBatchJobs(batchId: string): Promise<Job<T>[]>
await batchProc.setBatchProgress(batchId: string, progress: number): Promise<void>
await batchProc.removeBatch(batchId: string): Promise<void>
```

---

## PriorityQueue

Queue with multiple priority levels.

```typescript
import { PriorityQueue } from '@stacksjs/bun-queue'

const pq = new PriorityQueue('urgent-tasks', {
  levels: 5,              // 0-4 priority levels
  defaultLevel: 2,        // default priority
  dynamicReordering: true, // re-sort periodically
  reorderInterval: 5000,  // reorder every 5s
})
```

### Methods

```typescript
await pq.add(data: T, options?: JobOptions): Promise<Job<T>>
pq.process(concurrency: number, handler: (job: Job<T>) => Promise<any>): void
await pq.getJob(jobId: string): Promise<Job<T> | null>
await pq.getJobs(status: JobStatus, start?: number, end?: number): Promise<Job<T>[]>
await pq.getJobCounts(): Promise<Record<JobStatus, number>>
await pq.removeJob(jobId: string): Promise<void>
await pq.empty(): Promise<void>
await pq.close(): Promise<void>
```

---

## DeadLetterQueue

Stores permanently failed jobs for inspection.

```typescript
const dlq = queue.getDeadLetterQueue()
```

### Methods

```typescript
dlq.getQueueName(): string
await dlq.moveToDeadLetter(job: Job<T>, reason: string): Promise<string>
await dlq.getJobs(start?: number, end?: number): Promise<Job<T>[]>
await dlq.republishJob(jobId: string, options?: { resetRetries?: boolean }): Promise<Job<T> | null>
await dlq.removeJob(jobId: string): Promise<boolean>
await dlq.clear(): Promise<void>
```

---

## DistributedLock

Redis-based distributed locking.

```typescript
const lock = queue.getLock()
// or
import { DistributedLock } from '@stacksjs/bun-queue'
const lock = new DistributedLock(redisClient, 'myapp:lock')
```

### Methods

```typescript
// Acquire a lock (returns token or null)
await lock.acquire(resource: string, options?: LockOptions): Promise<string | null>

// Release a lock
await lock.release(resource: string, token: string): Promise<boolean>

// Check if locked
await lock.isLocked(resource: string): Promise<boolean>

// Extend lock duration
await lock.extend(resource: string, token: string, duration: number): Promise<boolean>

// Execute with automatic lock/unlock
await lock.withLock(resource: string, fn: () => Promise<T>, options?: LockOptions): Promise<T>
```

### LockOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | `number` | `30000` | Lock duration (ms) |
| `autoExtend` | `boolean` | `true` | Auto-extend |
| `extendInterval` | `number` | — | Extension interval (ms) |
| `retries` | `number` | `0` | Acquire retries |
| `retryDelay` | `number` | `100` | Delay between retries (ms) |

---

## QueueGroup

Group related queues together.

```typescript
import { QueueGroup } from '@stacksjs/bun-queue'

const group = new QueueGroup('myapp', redisClient)
```

### Methods

```typescript
await group.addQueue(queue: Queue<T>, options?: GroupOptions): Promise<void>
await group.removeQueue(queueName: string, groupName?: string): Promise<void>
await group.getAllGroups(): Promise<Group[]>
await group.getGroup(groupName: string): Promise<Group | null>
await group.processGroup(groupName: string, handler: (job: Job<T>) => Promise<R>): Promise<void>
await group.addJobToGroup(groupName: string, data: T): Promise<Job<T>[]>
await group.closeGroup(groupName: string): Promise<void>
await group.closeAll(): Promise<void>
```

---

## QueueObservable

Monitor queues in real time.

```typescript
import { QueueObservable } from '@stacksjs/bun-queue'

const observable = new QueueObservable('myapp', redisClient)
```

### Methods

```typescript
await observable.createObservable(queues: Queue[], options?: ObservableOptions): Promise<Observable>
await observable.startObservable(observableId: string): Promise<void>
await observable.stopObservable(observableId: string): Promise<void>
await observable.removeObservable(observableId: string): Promise<void>
await observable.getAllObservables(): Promise<Observable[]>
await observable.getObservable(observableId: string): Promise<Observable | null>
await observable.getObservableStats(observableId: string): Promise<Record<string, any> | null>
await observable.closeAll(): Promise<void>
```

---

## RateLimiter

Control job processing speed.

```typescript
import { RateLimiter } from '@stacksjs/bun-queue'

const limiter = new RateLimiter(queue, {
  max: 100,
  duration: 60000,
  keyPrefix: (data) => `user:${data.userId}`,
})
```

### Methods

```typescript
await limiter.check(data?: any): Promise<RateLimitResult>
await limiter.checkByKey(key: string): Promise<RateLimitResult>

// RateLimitResult: { limited: boolean, remaining: number, resetIn: number }
```

---

## QueueManager

Manage multiple queue connections.

```typescript
import { getQueueManager, closeQueueManager } from '@stacksjs/bun-queue'

const manager = getQueueManager({
  default: 'redis',
  connections: {
    redis: {
      driver: 'redis',
      redis: { url: 'redis://localhost:6379' },
    },
  },
})
```

### Methods

```typescript
manager.connection(name?: string): QueueConnection
manager.queue(name?: string): Queue
manager.getConnections(): string[]
manager.addConnection(name: string, config: QueueConnectionConfig): void
manager.removeConnection(name: string): void
manager.setDefaultConnection(name: string): void
manager.getDefaultConnection(): string
await manager.closeAll(): Promise<void>

// Global helpers
const manager = getQueueManager(config?)
setQueueManager(manager)
await closeQueueManager()
```

---

## Middleware

Built-in middleware for job processing.

```typescript
import { middleware } from '@stacksjs/bun-queue'

class MyJob extends JobBase {
  middleware = [
    middleware.rateLimit(10, 1),                    // 10 per minute
    middleware.unique(60000),                        // unique for 60s
    middleware.throttle(5, 10000),                   // 5 per 10s
    middleware.withoutOverlapping(30000),            // no concurrent runs
    middleware.skipIf(() => isMaintenanceMode),      // conditional skip
    middleware.onFailure((err, job) => notify(err)), // failure handler
  ]

  async handle() { /* ... */ }
}
```

### Available Middleware

| Middleware | Factory | Description |
|-----------|---------|-------------|
| `RateLimitMiddleware` | `middleware.rateLimit(max, decayMinutes?, prefix?)` | Limit job rate |
| `UniqueJobMiddleware` | `middleware.unique(ttl?)` | Prevent duplicate jobs |
| `ThrottleMiddleware` | `middleware.throttle(allows, every, prefix?)` | Throttle execution |
| `WithoutOverlappingMiddleware` | `middleware.withoutOverlapping(ttl?, releaseAfter?)` | Prevent concurrent execution |
| `SkipIfMiddleware` | `middleware.skipIf(condition)` | Conditionally skip |
| `FailureMiddleware` | `middleware.onFailure(callback)` | Custom failure handling |

---

## LeaderElection

Elect a leader among distributed instances.

```typescript
import { LeaderElection } from '@stacksjs/bun-queue'

const election = new LeaderElection(redisClient, {
  heartbeatInterval: 10000,
  leaderTimeout: 30000,
  onBecomeLeader: () => console.log('I am the leader'),
  onLeadershipLost: () => console.log('Lost leadership'),
  onLeaderChanged: (id) => console.log('New leader:', id),
})

await election.start()
election.isCurrentLeader()
await election.getCurrentLeader()
await election.stop()
```

---

## WorkCoordinator

Distribute work across instances.

```typescript
import { WorkCoordinator } from '@stacksjs/bun-queue'

const coordinator = new WorkCoordinator(redisClient, {
  pollInterval: 5000,
  maxWorkersPerInstance: 10,
  jobsPerWorker: 10,
})

await coordinator.start()
coordinator.getWorkerCount()
await coordinator.getInstanceStatistics()
await coordinator.stop()
```

---

## JobEvents

Event emitter for queue lifecycle events.

```typescript
queue.events.on('jobAdded', (jobId, name) => {})
queue.events.on('jobRemoved', (jobId) => {})
queue.events.on('jobCompleted', (jobId, result) => {})
queue.events.on('jobFailed', (jobId, error) => {})
queue.events.on('jobProgress', (jobId, progress) => {})
queue.events.on('jobActive', (jobId) => {})
queue.events.on('jobStalled', (jobId) => {})
queue.events.on('jobDelayed', (jobId, delay) => {})
queue.events.on('ready', () => {})
queue.events.on('error', (error) => {})

// Batch events
queue.events.on('batchAdded', (batchId, jobIds) => {})
queue.events.on('batchCompleted', (batchId, results) => {})
queue.events.on('batchFailed', (batchId, errors) => {})
queue.events.on('batchProgress', (batchId, progress) => {})

// Group events
queue.events.on('groupCreated', (groupName) => {})
queue.events.on('groupRemoved', (groupName) => {})

// Observable events
queue.events.on('observableStarted', (observableId) => {})
queue.events.on('observableStopped', (observableId) => {})

// Dead letter events
queue.events.on('jobMovedToDeadLetter', (jobId, dlqName, reason) => {})
queue.events.on('jobRepublishedFromDeadLetter', (jobId, originalQueue) => {})
```

---

## Types

### JobStatus

```typescript
type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused'
```

### LogLevel

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent'
```
