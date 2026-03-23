import {
  JobBase,
  Queue,
  dispatch,
  getQueueManager,
  config,
  type ShouldQueue,
  type QueueConnectionConfig,
} from '../packages/bun-queue/src'

// Laravel-style Job
class WelcomeEmailJob extends JobBase implements ShouldQueue {
  public tries = 3

  constructor(private email: string, private name: string) {
    super()
  }

  async handle(): Promise<{ sent: boolean }> {
    // eslint-disable-next-line no-console
    console.log(`[WelcomeEmailJob] Sending welcome email to ${this.name} (${this.email})`)
    await new Promise(resolve => setTimeout(resolve, 1000))
    // eslint-disable-next-line no-console
    console.log(`[WelcomeEmailJob] ✅ Email sent successfully!`)
    return { sent: true }
  }

  uniqueId(): string {
    return `welcome_${this.email}`
  }
}

async function demonstrateUnifiedConfig() {
  // eslint-disable-next-line no-console
  console.log('🔧 Unified Configuration Demo\n')

  // 1. Show loaded configurations
  // eslint-disable-next-line no-console
  console.log('📋 Loaded Configurations:')
  // eslint-disable-next-line no-console
  console.log('Standard queue config:', {
    prefix: config.prefix,
    logLevel: config.logLevel,
    redisUrl: config.redis?.url,
    attempts: config.defaultJobOptions?.attempts,
  })
  // eslint-disable-next-line no-console
  console.log('')

  // 2. Create queues using different approaches
  // eslint-disable-next-line no-console
  console.log('🏗️  Creating Queues:')

  // Standard approach using existing config
  const configWithDriver: QueueConnectionConfig = {
    ...config,
    driver: 'redis',
  }
  const standardQueue = new Queue('standard-emails', configWithDriver)
  // eslint-disable-next-line no-console
  console.log('✅ Standard queue created with config')

  // Queue manager approach
  const queueManager = getQueueManager()
  const managedQueue = queueManager.queue('emails')
  // eslint-disable-next-line no-console
  console.log('✅ Managed queue created')
  // eslint-disable-next-line no-console
  console.log('')

  // 3. Process jobs with both approaches
  // eslint-disable-next-line no-console
  console.log('👷 Starting Workers:')

  // Standard queue processor
  standardQueue.process(1, async (job) => {
    // eslint-disable-next-line no-console
    console.log(`[StandardWorker] Processing job ${job.id}:`, job.data)
    await new Promise(resolve => setTimeout(resolve, 500))
    return { processed: true, worker: 'standard' }
  })

  // Managed queue processor
  managedQueue.process(1, async (job) => {
    // eslint-disable-next-line no-console
    console.log(`[ManagedWorker] Processing job ${job.id}:`, job.data)
    await new Promise(resolve => setTimeout(resolve, 500))
    return { processed: true, worker: 'managed' }
  })

  // eslint-disable-next-line no-console
  console.log('✅ Both workers started\n')

  // 4. Dispatch jobs to both queues
  // eslint-disable-next-line no-console
  console.log('🚀 Dispatching Jobs:')

  // Standard queue job (data-based)
  await standardQueue.add(
    {
      type: 'welcome-email',
      email: 'standard@example.com',
      name: 'Standard User'
    },
    { attempts: 2 }
  )
  // eslint-disable-next-line no-console
  console.log('✅ Standard job dispatched')

  // Laravel-style job
  const welcomeJob = new WelcomeEmailJob('laravel@example.com', 'Laravel User')
  await dispatch(welcomeJob)
  // eslint-disable-next-line no-console
  console.log('✅ Laravel job dispatched')
  // eslint-disable-next-line no-console
  console.log('')

  // 5. Monitor progress
  // eslint-disable-next-line no-console
  console.log('📊 Monitoring Progress:')
  let completed = 0
  const target = 2

  const monitor = setInterval(async () => {
    const standardCounts = await standardQueue.getJobCounts()
    const managedCounts = await managedQueue.getJobCounts()

    // eslint-disable-next-line no-console
    console.log(`Standard Queue - W:${standardCounts.waiting} A:${standardCounts.active} C:${standardCounts.completed} F:${standardCounts.failed}`)
    // eslint-disable-next-line no-console
    console.log(`Managed Queue  - W:${managedCounts.waiting} A:${managedCounts.active} C:${managedCounts.completed} F:${managedCounts.failed}`)

    completed = standardCounts.completed + managedCounts.completed

    if (completed >= target && standardCounts.active === 0 && managedCounts.active === 0) {
      // eslint-disable-next-line no-console
      console.log('\n🎉 All jobs completed!')
      // eslint-disable-next-line no-console
      console.log(`📈 Results: ${completed}/${target} jobs processed successfully`)

      clearInterval(monitor)
      await standardQueue.close()
      await queueManager.closeAll()
      // eslint-disable-next-line no-console
      console.log('✅ Demo completed successfully!')
    }
  }, 2000)

  // Graceful shutdown
  process.on('SIGINT', async () => {
    // eslint-disable-next-line no-console
    console.log('\n🛑 Shutting down...')
    clearInterval(monitor)
    await standardQueue.close()
    await queueManager.closeAll()
    process.exit(0)
  })
}

async function main() {
  try {
    await demonstrateUnifiedConfig()
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Demo failed:', error)
    process.exit(1)
  }
}

// Only run if this file is executed directly
if (import.meta.main) {
  main()
}