import { Queue } from '../bun-queue/src'
import { serveDashboard } from './src/index'

// Connect to the same queues the seed script populates
const queues = [
  new Queue('email', { logLevel: 'silent' }),
  new Queue('image-processing', { logLevel: 'silent' }),
  new Queue('report-generation', { logLevel: 'silent' }),
  new Queue('notifications', { logLevel: 'silent' }),
  new Queue('data-import', { logLevel: 'silent' }),
]

await serveDashboard({ port: 4400, queues })
