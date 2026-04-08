---
title: Install
description: Install bun-queue and its dependencies.
---

```typescript
import { Queue } from '@stacksjs/bun-queue'
import { serveDashboard } from '@stacksjs/bun-queue-dashboard'

const queues = [new Queue('emails'), new Queue('tasks')]
await serveDashboard({ port: 4400, queues })
// Open <http://localhost:4400>
```
