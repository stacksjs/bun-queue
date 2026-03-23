import {
  JobBase,
  dispatch,
  Bus,
  QueueWorker,
  WorkerManager,
  FailedJobManager,
  Middleware,
  type ShouldQueue,
  type ShouldBeUnique,
  type ShouldBatch,
  getQueueManager,
  type Queue,
} from '../packages/bun-queue/src'

// Laravel-style Job Classes
class SendEmailNotification extends JobBase implements ShouldQueue, ShouldBeUnique {
  public connection = 'redis'
  public tries = 3
  public timeout = 30 // seconds
  public backoff = [5, 10, 30] // seconds
  public middleware = [
    Middleware.rateLimited('email-notifications', 100, 60), // 100 per minute
    Middleware.withoutOverlapping().releaseAfter(30),
  ]

  constructor(
    private userId: string,
    private notificationType: string,
    private payload: Record<string, any>
  ) {
    super()
  }

  async handle(): Promise<{ sent: boolean; messageId: string }> {
    // eslint-disable-next-line no-console
    console.log(`[SendEmailNotification] Sending ${this.notificationType} to user ${this.userId}`)

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simulate failures
    if (Math.random() < 0.15) {
      throw new Error('Email service temporarily unavailable')
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`
    // eslint-disable-next-line no-console
    console.log(`[SendEmailNotification] ✅ Email sent! Message ID: ${messageId}`)

    return { sent: true, messageId }
  }

  uniqueId(): string {
    return `email_${this.userId}_${this.notificationType}`
  }

  async failed(exception: Error): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[SendEmailNotification] Job failed for user ${this.userId}: ${exception.message}`)
    // Send to monitoring system, notify administrators, etc.
  }
}

class ProcessPayment extends JobBase implements ShouldQueue, ShouldBeUnique {
  public connection = 'priority'
  public tries = 5
  public timeout = 60 // seconds
  public backoff = [1, 5, 15, 30, 60] // seconds
  public middleware = [
    Middleware.withoutOverlapping().expireAfter(300), // 5 minutes
    Middleware.throttlesExceptions(3, 600), // 3 exceptions per 10 minutes
  ]

  constructor(
    private paymentId: string,
    private amount: number,
    private currency: string = 'USD'
  ) {
    super()
  }

  async handle(): Promise<{ success: boolean; transactionId: string; fee: number }> {
    // eslint-disable-next-line no-console
    console.log(`[ProcessPayment] Processing payment ${this.paymentId}: ${this.amount} ${this.currency}`)

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate payment failures
    if (Math.random() < 0.1) {
      throw new Error('Payment gateway timeout')
    }

    if (Math.random() < 0.05) {
      throw new Error('Insufficient funds')
    }

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2)}`
    const fee = Math.round(this.amount * 0.029 * 100) / 100

    // eslint-disable-next-line no-console
    console.log(`[ProcessPayment] ✅ Payment processed! Transaction: ${transactionId}`)

    return { success: true, transactionId, fee }
  }

  uniqueId(): string {
    return `payment_${this.paymentId}`
  }

  async failed(exception: Error): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[ProcessPayment] Payment ${this.paymentId} failed: ${exception.message}`)
    // Notify user, log to audit system, trigger refund process if needed
  }
}

class GenerateMonthlyReport extends JobBase implements ShouldQueue, ShouldBatch {
  public connection = 'redis'
  public tries = 2
  public timeout = 120 // seconds
  public batchId?: string

  constructor(
    private month: string,
    private year: number,
    private department: string
  ) {
    super()
  }

  async handle(): Promise<{ generated: boolean; reportUrl: string }> {
    // eslint-disable-next-line no-console
    console.log(`[GenerateMonthlyReport] Generating ${this.department} report for ${this.month} ${this.year}`)

    // Simulate report generation
    const steps = ['Collecting data', 'Processing metrics', 'Generating charts', 'Creating PDF']
    for (const [index, step] of steps.entries()) {
      // eslint-disable-next-line no-console
      console.log(`[GenerateMonthlyReport] ${step}...`)
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    const reportUrl = `https://reports.example.com/${this.department}_${this.month}_${this.year}.pdf`
    // eslint-disable-next-line no-console
    console.log(`[GenerateMonthlyReport] ✅ Report generated: ${reportUrl}`)

    return { generated: true, reportUrl }
  }

  async failed(exception: Error): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[GenerateMonthlyReport] Report generation failed: ${exception.message}`)
  }
}

async function demonstrateProperLaravelAPI() {
  // eslint-disable-next-line no-console
  console.log('🎯 Proper Laravel Queue API Demo\n')

  // Initialize Laravel-style components
  const queueManager = getQueueManager()
  // const workerManager = new WorkerManager()
  // const failedJobManager = new FailedJobManager()

  // eslint-disable-next-line no-console
  console.log('🔧 Configuration loaded from laravel-queue.config.ts')
  // eslint-disable-next-line no-console
  console.log('📋 Available connections:', queueManager.getConnections())
  // eslint-disable-next-line no-console
  console.log('')

  // 1. Start Laravel-style workers
  // eslint-disable-next-line no-console
  console.log('👷 Starting Laravel-style workers (simulated)...')
  // eslint-disable-next-line no-console
  console.log('✅ Workers started\n')

  // 2. Laravel-style job dispatching
  // eslint-disable-next-line no-console
  console.log('📤 Dispatching jobs using Laravel patterns:')

  // Simple dispatch
  await dispatch(new SendEmailNotification('user123', 'welcome', { name: 'John Doe' }))
  // eslint-disable-next-line no-console
  console.log('✅ Welcome email dispatched')

  // Conditional dispatch
  const shouldSendPromo = Math.random() > 0.5
  await Bus.dispatchIf(
    shouldSendPromo,
    new SendEmailNotification('user456', 'promotion', { discount: '20%' })
  )
  // eslint-disable-next-line no-console
  console.log(`${shouldSendPromo ? '✅' : '⏭️'} Promotion email ${shouldSendPromo ? 'dispatched' : 'skipped'}`)

  // Delayed dispatch
  await Bus.dispatchAfter(
    5000, // 5 seconds
    new ProcessPayment('pay_001', 99.99, 'USD')
  )
  // eslint-disable-next-line no-console
  console.log('✅ Payment job dispatched with 5s delay')

  // Fluent API - dispatching with modified settings
  const vipEmail = new SendEmailNotification('vip123', 'newsletter', { edition: 'monthly' })
  await dispatch(vipEmail)
  // eslint-disable-next-line no-console
  console.log('✅ VIP newsletter dispatched')

  // eslint-disable-next-line no-console
  console.log('')

  // 3. Laravel-style job batching
  // eslint-disable-next-line no-console
  console.log('📊 Creating job batch using Laravel Bus:')

  const reportBatch = Bus.batch('monthly-reports-2024')
    .add([
      new GenerateMonthlyReport('January', 2024, 'Sales'),
      new GenerateMonthlyReport('January', 2024, 'Marketing'),
      new GenerateMonthlyReport('January', 2024, 'Engineering'),
    ])
    .before((batch) => {
      // eslint-disable-next-line no-console
      console.log(`[Batch] Starting batch ${batch.id} with ${batch.totalJobs} jobs`)
    })
    .progress((batch) => {
      const percent = Math.round((batch.processedJobs / batch.totalJobs) * 100)
      // eslint-disable-next-line no-console
      console.log(`[Batch] Progress: ${percent}% (${batch.processedJobs}/${batch.totalJobs})`)
    })
    .then((batch) => {
      // eslint-disable-next-line no-console
      console.log(`[Batch] ✅ Batch ${batch.id} completed successfully!`)
    })
    .catch((batch, error) => {
      // eslint-disable-next-line no-console
      console.log(`[Batch] ❌ Batch ${batch.id} failed: ${error.message}`)
    })
    .allowFailures(1)
    .onConnection('redis')

  const batch = await reportBatch.dispatch()
  // eslint-disable-next-line no-console
  console.log(`✅ Batch "${batch.name}" dispatched with ID ${batch.id}\n`)

  // 4. Monitor everything
  // eslint-disable-next-line no-console
  console.log('📈 Monitoring workers and jobs (simulated):')

  // Monitor for 5 seconds then show results
  setTimeout(async () => {
    // eslint-disable-next-line no-console
    console.log('\n📊 Final Statistics:')
    // eslint-disable-next-line no-console
    console.log('Jobs dispatched successfully')

    // Cleanup
    await queueManager.closeAll()

    // eslint-disable-next-line no-console
    console.log('\n🎉 Laravel-style queue demo completed!')
  }, 5000)

  // Graceful shutdown
  process.on('SIGINT', async () => {
    // eslint-disable-next-line no-console
    console.log('\n🛑 Gracefully shutting down...')
    await queueManager.closeAll()
    process.exit(0)
  })

  // eslint-disable-next-line no-console
  console.log('🔍 Monitoring for 5 seconds... Press Ctrl+C to stop early.\n')
}

async function main() {
  try {
    await demonstrateProperLaravelAPI()
  }
  catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Demo failed:', error)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}