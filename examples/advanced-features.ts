import { BatchProcessor, Queue, QueueGroup, QueueObservable } from '../packages/bun-queue/src'

async function main() {
  console.log('🚀 Advanced Features Example - Groups, Observables, and Batches')

  // Create a few queues
  const emailQueue = new Queue<{ to: string, subject: string, body: string }>('email', {
    redis: { url: 'redis://localhost:6379' },
  })

  const notificationQueue = new Queue<{ userId: string, message: string }>('notification', {
    redis: { url: 'redis://localhost:6379' },
  })

  const imageProcessingQueue = new Queue<{ imageUrl: string, filters: string[] }>('image-processing', {
    redis: { url: 'redis://localhost:6379' },
  })

  console.log('✅ Queues created')

  // ========================
  // Example 1: Batch Processing
  // ========================
  console.log('\n📦 Example 1: Batch Processing')

  // Create a batch processor for the email queue
  const batchProcessor = new BatchProcessor(emailQueue)

  // Create a batch of email jobs
  const emailJobs = [
    { to: 'user1@example.com', subject: 'Welcome!', body: 'Welcome to our platform!' },
    { to: 'user2@example.com', subject: 'Welcome!', body: 'Welcome to our platform!' },
    { to: 'user3@example.com', subject: 'Welcome!', body: 'Welcome to our platform!' },
  ]

  const batch = await batchProcessor.createBatch(emailJobs, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  })

  console.log(`📨 Created batch ${batch.id} with ${batch.jobs.length} email jobs`)

  // Process the batch
  await batchProcessor.processBatch(batch.id, async (jobs) => {
    console.log(`🔄 Processing batch of ${jobs.length} emails together`)

    // Update progress
    await batchProcessor.setBatchProgress(batch.id, 50)

    // Simulate batch processing (in a real scenario, you might use a bulk email API)
    return jobs.map((job) => {
      console.log(`📧 Would send email to ${job.data.to} with subject "${job.data.subject}"`)
      return { sent: true, to: job.data.to }
    })
  })

  console.log('✅ Batch processing complete')

  // ========================
  // Example 2: Queue Groups
  // ========================
  console.log('\n👥 Example 2: Queue Groups')

  // Create a queue group
  const queueGroup = new QueueGroup('app', emailQueue.redisClient)

  // Add queues to the group
  await queueGroup.addQueue(emailQueue, { name: 'notifications', maxConcurrency: 5 })
  await queueGroup.addQueue(notificationQueue, { name: 'notifications', maxConcurrency: 5 })

  // Add job to all queues in the group
  const groupJobs = await queueGroup.addJobToGroup('notifications', {
    to: 'all-users@example.com',
    subject: 'System Maintenance',
    body: 'Our system will be down for maintenance tonight.',
  } as any)

  console.log(`📝 Added job to all queues in the 'notifications' group, created ${groupJobs.length} jobs`)

  // Process jobs in the group (using imported Job type from src)
  await queueGroup.processGroup<any>('notifications', async (job) => {
    if (job.name === 'email') {
      console.log(`📧 Processing email job: ${job.data.subject} to ${job.data.to}`)
      return { sent: true }
    }
    else if (job.name === 'notification') {
      console.log(`🔔 Processing notification job: ${job.data.message} to ${job.data.userId}`)
      return { delivered: true }
    }
    return null
  })

  // ========================
  // Example 3: Observables
  // ========================
  console.log('\n👁️ Example 3: Observables')

  // Create an observable for all queues
  const observable = new QueueObservable('app', emailQueue.redisClient)

  // Create an observable that monitors all queues
  const queueObservable = await observable.createObservable(
    [emailQueue, notificationQueue, imageProcessingQueue],
    { interval: 2000, autoStart: true },
  )

  console.log(`👀 Created observable ${queueObservable.id} monitoring ${queueObservable.queues.length} queues`)

  // Wait a moment for the first stats to be collected
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Get stats
  const stats = await observable.getObservableStats(queueObservable.id)
  console.log('📊 Queue stats:', stats)

  // Stop the observable
  await observable.stopObservable(queueObservable.id)
  console.log(`⏹️ Stopped observable ${queueObservable.id}`)

  // Close everything
  console.log('\n🧹 Cleaning up...')
  await emailQueue.close()
  await notificationQueue.close()
  await imageProcessingQueue.close()
  await queueGroup.closeAll()
  await observable.closeAll()

  console.log('✅ Done!')
}

main().catch(console.error)
