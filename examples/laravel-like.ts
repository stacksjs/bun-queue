import {
  JobBase,
  dispatch,
  dispatchAfter,
  chain,
  batch,
  getQueueManager,
  middleware,
  type JobContract,
} from '../packages/bun-queue/src'

// Define job classes
class SendEmailJob extends JobBase {
  constructor(
    private to: string,
    private subject: string,
    private body: string
  ) {
    super()
    this.queue = 'emails'
    this.tries = 3
    this.timeout = 30000
  }

  async handle(): Promise<{ sent: boolean; messageId: string }> {
    console.log(`[SendEmailJob] Sending email to ${this.to}`)
    console.log(`[SendEmailJob] Subject: ${this.subject}`)

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Randomly fail some jobs to demonstrate retry
    if (Math.random() < 0.2) {
      throw new Error('SMTP server timeout')
    }

    console.log(`[SendEmailJob] Email sent successfully to ${this.to}`)
    return {
      sent: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    }
  }

  uniqueId(): string {
    return `email_${this.to}_${this.subject}`
  }
}

class ProcessImageJob extends JobBase {
  constructor(
    private imageId: string,
    private operations: string[]
  ) {
    super()
    this.queue = 'images'
    this.tries = 2
    this.middleware = [
      middleware.withoutOverlapping(3600),
      middleware.rateLimit(10, 1), // 10 per minute
    ]
  }

  async handle(): Promise<{ processed: boolean; url: string }> {
    console.log(`[ProcessImageJob] Processing image ${this.imageId}`)
    console.log(`[ProcessImageJob] Operations: ${this.operations.join(', ')}`)

    // Simulate image processing
    for (const operation of this.operations) {
      console.log(`[ProcessImageJob] Applying ${operation}...`)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`[ProcessImageJob] Image ${this.imageId} processed successfully`)
    return {
      processed: true,
      url: `https://cdn.example.com/images/${this.imageId}_processed.jpg`,
    }
  }

  uniqueId(): string {
    return this.imageId
  }
}

class GenerateReportJob extends JobBase {
  constructor(
    private reportType: string,
    private userId: string,
    private filters: Record<string, any>
  ) {
    super()
    this.queue = 'reports'
    this.tries = 5
    this.backoff = [1000, 2000, 4000, 8000, 16000] // Exponential backoff
    this.middleware = [
      middleware.unique(7200), // Unique for 2 hours
      middleware.throttle(3, 60000), // Max 3 per minute
    ]
  }

  async handle(): Promise<{ generated: boolean; downloadUrl: string }> {
    console.log(`[GenerateReportJob] Generating ${this.reportType} report for user ${this.userId}`)

    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Sometimes fail to demonstrate retry
    if (Math.random() < 0.1) {
      throw new Error('Database connection timeout during report generation')
    }

    console.log(`[GenerateReportJob] Report generated successfully`)
    return {
      generated: true,
      downloadUrl: `https://reports.example.com/${this.reportType}_${this.userId}_${Date.now()}.pdf`,
    }
  }

  uniqueId(): string {
    return `${this.reportType}_${this.userId}_${JSON.stringify(this.filters)}`
  }
}

class SendNotificationJob extends JobBase {
  constructor(
    private userId: string,
    private message: string,
    private channels: string[]
  ) {
    super()
    this.queue = 'notifications'
    this.tries = 3
    this.middleware = [
      middleware.skipIf(async () => {
        // Skip if user has disabled notifications
        console.log(`[SendNotificationJob] Checking if user ${this.userId} allows notifications...`)
        return Math.random() < 0.1 // 10% chance to skip
      }),
    ]
  }

  async handle(): Promise<{ sent: boolean; channels: string[] }> {
    console.log(`[SendNotificationJob] Sending notification to user ${this.userId}`)
    console.log(`[SendNotificationJob] Message: ${this.message}`)
    console.log(`[SendNotificationJob] Channels: ${this.channels.join(', ')}`)

    // Simulate sending notifications
    await new Promise(resolve => setTimeout(resolve, 800))

    console.log(`[SendNotificationJob] Notification sent successfully`)
    return {
      sent: true,
      channels: this.channels,
    }
  }
}

async function main() {
  console.log('=== Laravel-like bun-queue API Demo ===\n')

  // Initialize queue manager (uses bunfig configuration)
  const queueManager = getQueueManager()

  // Start workers for different queues
  const emailQueue = queueManager.queue('emails')
  const imageQueue = queueManager.queue('images')
  const reportQueue = queueManager.queue('reports')
  const notificationQueue = queueManager.queue('notifications')

  // Process email queue
  emailQueue.process(3, async (job) => {
    const jobData = job.data as any
    const jobInstance = jobData.job as JobContract
    return jobInstance.handle()
  })

  // Process image queue
  imageQueue.process(2, async (job) => {
    const jobData = job.data as any
    const jobInstance = jobData.job as JobContract
    return jobInstance.handle()
  })

  // Process report queue
  reportQueue.process(1, async (job) => {
    const jobData = job.data as any
    const jobInstance = jobData.job as JobContract
    return jobInstance.handle()
  })

  // Process notification queue
  notificationQueue.process(5, async (job) => {
    const jobData = job.data as any
    const jobInstance = jobData.job as JobContract
    return jobInstance.handle()
  })

  console.log('Workers started, dispatching jobs...\n')

  // 1. Basic job dispatching
  console.log('1. Basic job dispatching:')
  const emailJob = new SendEmailJob(
    'user@example.com',
    'Welcome to our platform!',
    'Thank you for signing up. Get started by exploring our features.'
  )

  await dispatch(emailJob)
  console.log('✓ Email job dispatched\n')

  // 2. Chained job dispatching with fluent API
  console.log('2. Chained job dispatching:')
  await chain(
    new SendEmailJob('admin@example.com', 'System Alert', 'High CPU usage detected')
  )
    .onQueue('priority-emails')
    .withTries(5)
    .withTimeout(60000)
    .dispatch()

  console.log('✓ Priority email job dispatched with custom options\n')

  // 3. Delayed job dispatching
  console.log('3. Delayed job dispatching:')
  const delayedEmailJob = new SendEmailJob(
    'user@example.com',
    'Weekly Summary',
    'Here is your weekly activity summary.'
  )

  await dispatchAfter(5000, delayedEmailJob) // Dispatch after 5 seconds
  console.log('✓ Delayed email job dispatched (5 second delay)\n')

  // 4. Job batching
  console.log('4. Job batching:')
  const emailBatch = batch('weekly-emails')
    .add(new SendEmailJob('user1@example.com', 'Newsletter', 'Weekly newsletter content'))
    .add(new SendEmailJob('user2@example.com', 'Newsletter', 'Weekly newsletter content'))
    .add(new SendEmailJob('user3@example.com', 'Newsletter', 'Weekly newsletter content'))
    .allowFailures()
    .withConcurrency(2)
    .onQueue('bulk-emails')

  const batchResult = await emailBatch.dispatch()
  console.log(`✓ Email batch dispatched: ${batchResult.total} jobs\n`)

  // 5. Complex job with middleware
  console.log('5. Complex job with middleware:')
  const imageJob = new ProcessImageJob('img_12345', ['resize', 'watermark', 'optimize'])
  await dispatch(imageJob)
  console.log('✓ Image processing job dispatched with middleware\n')

  // 6. Report generation with dependencies
  console.log('6. Report generation:')
  const reportJob = new GenerateReportJob('sales', 'user_789', { period: 'monthly', year: 2024 })
  const _reportJobResult = await dispatch(reportJob)

  // Send notification after report is generated
  const notificationJob = new SendNotificationJob(
    'user_789',
    'Your monthly sales report is ready!',
    ['email', 'push', 'sms']
  )

  await chain(notificationJob)
    .delay(1000) // Small delay to ensure report job starts
    .dispatch()

  console.log('✓ Report and notification jobs dispatched\n')

  // 7. Multiple jobs with different configurations
  console.log('7. Multiple image processing jobs:')
  for (let i = 1; i <= 5; i++) {
    const job = new ProcessImageJob(`batch_img_${i}`, ['resize', 'compress'])
    await chain(job)
      .onQueue('batch-images')
      .withTags('batch-processing', `batch-${Math.ceil(i / 2)}`)
      .dispatch()
  }
  console.log('✓ Batch image processing jobs dispatched\n')

  // Monitor job progress
  let totalJobs = 0
  const monitorInterval = setInterval(async () => {
    const [emailCounts, imageCounts, reportCounts, notificationCounts] = await Promise.all([
      emailQueue.getJobCounts(),
      imageQueue.getJobCounts(),
      reportQueue.getJobCounts(),
      notificationQueue.getJobCounts(),
    ])

    const total = {
      waiting: emailCounts.waiting + imageCounts.waiting + reportCounts.waiting + notificationCounts.waiting,
      active: emailCounts.active + imageCounts.active + reportCounts.active + notificationCounts.active,
      completed: emailCounts.completed + imageCounts.completed + reportCounts.completed + notificationCounts.completed,
      failed: emailCounts.failed + imageCounts.failed + reportCounts.failed + notificationCounts.failed,
    }

    if (totalJobs === 0) {
      totalJobs = total.waiting + total.active + total.completed + total.failed
    }

    console.log('\n📊 Queue Status:')
    console.log(`   Waiting: ${total.waiting}`)
    console.log(`   Active: ${total.active}`)
    console.log(`   Completed: ${total.completed}`)
    console.log(`   Failed: ${total.failed}`)

    if (total.waiting === 0 && total.active === 0 && totalJobs > 0) {
      console.log('\n🎉 All jobs processed!')
      console.log(`   Success rate: ${((total.completed / totalJobs) * 100).toFixed(1)}%`)

      clearInterval(monitorInterval)
      await queueManager.closeAll()
      console.log('\n✅ Queue manager closed, demo complete.')
    }
  }, 2000)

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...')
    clearInterval(monitorInterval)
    await queueManager.closeAll()
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('Demo failed:', error)
  process.exit(1)
})