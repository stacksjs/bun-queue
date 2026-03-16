/**
 * Seed script — populates Redis with real bun-queue jobs for devtools testing.
 *
 * Usage: cd packages/bun-queue && bun run ../devtools/seed.ts
 */
import { Queue } from '../bun-queue/src'

const emailQueue = new Queue('email', { logLevel: 'silent' })
const imageQueue = new Queue('image-processing', { logLevel: 'silent' })
const reportQueue = new Queue('report-generation', { logLevel: 'silent' })
const notificationQueue = new Queue('notifications', { logLevel: 'silent' })
const importQueue = new Queue('data-import', { logLevel: 'silent' })

// Clear existing jobs
for (const q of [emailQueue, imageQueue, reportQueue, notificationQueue, importQueue]) {
  await q.empty()
}

console.log('Seeding queues...')

// ── Email Queue ──
for (let i = 1; i <= 12; i++) {
  await emailQueue.add(
    { to: `user${i}@example.com`, subject: `Welcome Email #${i}`, template: 'welcome' },
    { attempts: 3 },
  )
}

// ── Image Processing ──
for (let i = 1; i <= 8; i++) {
  await imageQueue.add(
    { userId: `user-${i}`, file: `photo-${i}.jpg`, size: `${(Math.random() * 5 + 0.5).toFixed(1)}MB` },
    { attempts: 2 },
  )
}

// ── Report Generation ──
const reportTypes = ['Financial Report', 'Analytics Summary', 'Inventory Audit', 'User Activity', 'Compliance Check']
for (let i = 1; i <= 5; i++) {
  await reportQueue.add(
    { reportType: reportTypes[i - 1], format: 'pdf' },
    { attempts: 2 },
  )
}

// ── Notifications ──
for (let i = 1; i <= 15; i++) {
  await notificationQueue.add(
    { userId: `user-${100 + i}`, message: `Notification #${i}`, channel: i % 3 === 0 ? 'sms' : 'push' },
    { attempts: 1 },
  )
}

// ── Data Import ──
const sources = ['CSV Upload', 'REST API', 'Database Sync', 'Spreadsheet Import']
for (let i = 1; i <= 4; i++) {
  await importQueue.add(
    { source: sources[i - 1], records: Math.floor(Math.random() * 5000 + 500) },
    { attempts: 3 },
  )
}

console.log('Processing jobs to create realistic states...')

// Process emails — complete most, fail a couple
await new Promise<void>((resolve) => {
  emailQueue.process(3, async (job) => {
    if (job.data.subject.includes('#4') || job.data.subject.includes('#7')) {
      throw new Error('SMTP connection refused')
    }
    return { sent: true, recipient: job.data.to }
  })
  setTimeout(async () => { await emailQueue.close(); resolve() }, 4000)
})

// Process images — complete some, fail one
await new Promise<void>((resolve) => {
  imageQueue.process(2, async (job) => {
    if (job.data.file === 'photo-3.jpg') {
      throw new Error('Unsupported image format')
    }
    return { resized: true, output: `thumb-${job.data.file}` }
  })
  setTimeout(async () => { await imageQueue.close(); resolve() }, 3000)
})

// Process reports
await new Promise<void>((resolve) => {
  reportQueue.process(1, async (job) => {
    if (job.data.reportType === 'Inventory Audit') {
      throw new Error('Database connection timeout')
    }
    return { generated: true, pages: Math.floor(Math.random() * 50 + 5) }
  })
  setTimeout(async () => { await reportQueue.close(); resolve() }, 3000)
})

// Process notifications
await new Promise<void>((resolve) => {
  notificationQueue.process(5, async (job) => {
    return { delivered: true, channel: job.data.channel }
  })
  setTimeout(async () => { await notificationQueue.close(); resolve() }, 3000)
})

// Leave data-import as waiting
await importQueue.close()

console.log('\nSeed complete!')
console.log('  Email:         12 jobs')
console.log('  Image:          8 jobs')
console.log('  Report:         5 jobs')
console.log('  Notification:  15 jobs')
console.log('  Import:         4 jobs (all waiting)')
console.log('\nStart dashboard: cd packages/bun-queue && bun run ../devtools/server.ts')

process.exit(0)
