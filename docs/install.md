---
title: Install
description: Install bun-queue and its dependencies.
---

```sh [pnpm]
pnpm add @stacksjs/bun-queue
```

```sh [yarn]
yarn add @stacksjs/bun-queue
```

:::

## Redis Setup

bun-queue requires a running Redis instance. If you don't have one:

```sh
# macOS
brew install redis
brew services start redis

# Docker
docker run -d --name redis -p 6379:6379 redis:latest

# Linux
sudo apt install redis-server
sudo systemctl start redis
```

Verify Redis is running:

```sh
redis-cli ping
# PONG
```

## Environment Variables

bun-queue reads the following environment variables:

```sh
# .env
REDIS_URL=redis://localhost:6379
```

If `REDIS_URL` is not set, bun-queue defaults to `redis://localhost:6379`.

## Verify Installation

```typescript
import { Queue } from '@stacksjs/bun-queue'

const queue = new Queue('test')
const isHealthy = await queue.ping()

console.log('Connected:', isHealthy) // true
await queue.close()
```

## Dashboard (Optional)

The devtools dashboard is included in the `@stacksjs/bun-queue-dashboard` package:

```sh
bun add @stacksjs/bun-queue-dashboard
```

```typescript
import { Queue } from '@stacksjs/bun-queue'
import { serveDashboard } from '@stacksjs/bun-queue-dashboard'

const queues = [new Queue('emails'), new Queue('tasks')]
await serveDashboard({ port: 4400, queues })
// Open http://localhost:4400
```
