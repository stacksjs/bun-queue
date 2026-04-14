---
title: Configuration File
description: Configure bun-queue using a configuration file.
---
| `maxRetries` | `number` | `3` | Retries before DLQ |
| `processFailed` | `boolean` | `false` | Auto-process failed |
| `removeFromOriginalQueue` | `boolean` | `true` | Remove from failed list |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
