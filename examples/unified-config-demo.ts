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
    console.log(`[WelcomeEmailJob] Sending welcome email to ${this.name} (${this.email})`)
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log(`[WelcomeEmailJob] ✅ Email sent successfully!`)
    return { sent: true }
  }

  uniqueId(): string {
    return `welcome_${this.email}`
  }
}

async function demonstrateUnifiedConfig() {
  console.log('🔧 Unified Configuration Demo\n')

  // 1. Show loaded configurations
  console.log('📋 Loaded Configurations:')
  console.log('Standard queue config:', {
    prefix: config.prefix,
    logLevel: config.logLevel,
    redisUrl: config.redis?.url,
    attempts: config.defaultJobOptions?.attempts,
  })
  console.log('')

  // 2. Create queues using different approaches
  console.log('🏗️  Creating Queues:')

  // Standard approach using existing config
  const configWithDriver: QueueConnectionConfig = {
    ...config,
    driver: 'redis',
  }
  const standardQueue = new Queue('standard-emails', configWithDriver)
  console.log('✅ Standard queue created with config')

  // Queue manager approach
  const queueManager = getQueueManager()
  const managedQueue = queueManager.queue('emails')
  console.log('✅ Managed queue created')
  console.log('')

  // 3. Process jobs with both approaches
  console.log('👷 Starting Workers:')

  // Standard queue processor
  standardQueue.process(1, async (job) => {
    console.log(`[StandardWorker] Processing job ${job.id}:`, job.data)
    await new Promise(resolve => setTimeout(resolve, 500))
    return { processed: true, worker: 'standard' }
  })

  // Managed queue processor
  managedQueue.process(1, async (job) => {
    console.log(`[ManagedWorker] Processing job ${job.id}:`, job.data)
    await new Promise(resolve => setTimeout(resolve, 500))
    return { processed: true, worker: 'managed' }
  })

  console.log('✅ Both workers started\n')

  // 4. Dispatch jobs to both queues
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
  console.log('✅ Standard job dispatched')

  // Laravel-style job
  const welcomeJob = new WelcomeEmailJob('laravel@example.com', 'Laravel User')
  await dispatch(welcomeJob)
  console.log('✅ Laravel job dispatched')
  console.log('')

  // 5. Monitor progress
  console.log('📊 Monitoring Progress:')
  let completed = 0
  const target = 2

  const monitor = setInterval(async () => {
    const standardCounts = await standardQueue.getJobCounts()
    const managedCounts = await managedQueue.getJobCounts()

    console.log(`Standard Queue - W:${standardCounts.waiting} A:${standardCounts.active} C:${standardCounts.completed} F:${standardCounts.failed}`)
    console.log(`Managed Queue  - W:${managedCounts.waiting} A:${managedCounts.active} C:${managedCounts.completed} F:${managedCounts.failed}`)

    completed = standardCounts.completed + managedCounts.completed

    if (completed >= target && standardCounts.active === 0 && managedCounts.active === 0) {
      console.log('\n🎉 All jobs completed!')
      console.log(`📈 Results: ${completed}/${target} jobs processed successfully`)

      clearInterval(monitor)
      await standardQueue.close()
      await queueManager.closeAll()
      console.log('✅ Demo completed successfully!')
    }
  }, 2000)

  // Graceful shutdown
  process.on('SIGINT', async () => {
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
    console.error('❌ Demo failed:', error)
    process.exit(1)
  }
}

// Only run if this file is executed directly
if (import.meta.main) {
  main()
}