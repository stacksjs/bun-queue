---
title: Configuration File
description: Configure bun-queue using a configuration file.
---
| `lifo` | `boolean` | `false` | Last-in-first-out order |
| `timeout` | `number` | — | Job timeout (ms) |
| `jobId` | `string` | auto | Custom job ID |
| `dependsOn` | `string &#124; string[]` | — | Job dependency IDs |
| `deadLetter` | `boolean &#124; DeadLetterQueueOptions` | — | Per-job DLQ config |
| `repeat.cron` | `string` | — | Cron expression |
| `repeat.every` | `number` | — | Repeat interval (ms) |
| `repeat.limit` | `number` | — | Max repetitions |

### `DeadLetterQueueOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `false` | Enable DLQ |
| `queueSuffix` | `string` | `'-dead-letter'` | DLQ name suffix |
| `maxRetries` | `number` | `3` | Retries before DLQ |
| `processFailed` | `boolean` | `false` | Auto-process failed |
| `removeFromOriginalQueue` | `boolean` | `true` | Remove from failed list |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
