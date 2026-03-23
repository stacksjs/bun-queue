import {
  JobBase,
  dispatch,
  chain,
  batch,
  getQueueManager,
  Queue,
  middleware,
  type ShouldQueue,
} from '../packages/bun-queue/src'

// Job classes with different configurations
class ProcessPaymentJob extends JobBase implements ShouldQueue {
  public queue = 'payments'
  public connection = 'priority' // Uses priority connection from config
  public tries = 5
  public timeout = 60000
  public middleware = [
    middleware.unique(3600), // Unique for 1 hour
    middleware.withoutOverlapping(1800), // No overlapping for 30 minutes
    middleware.rateLimit(10, 60000), // Max 10 per minute
  ]

  constructor(
    private paymentId: string,
    private amount: number,
    private currency: string = 'USD'
  ) {
    super()
  }

  async handle(): Promise<{ processed: boolean; transactionId: string; fee: number }> {
    // eslint-disable-next-line no-console
    console.log(`[ProcessPaymentJob] Processing payment ${this.paymentId}`)
    // eslint-disable-next-line no-console
    console.log(`[ProcessPaymentJob] Amount: ${this.amount} ${this.currency}`)

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate occasional payment failures
    if (Math.random() < 0.15) {
      throw new Error('Payment gateway timeout - please retry')
    }

    // Simulate declined payments
    if (Math.random() < 0.1) {
      throw new Error('Payment declined by issuer')
    }

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2)}`
    const fee = Math.round(this.amount * 0.029 * 100) / 100 // 2.9% fee

    // eslint-disable-next-line no-console
    console.log(`[ProcessPaymentJob] ✅ Payment processed! Transaction: ${transactionId}`)

    return {
      processed: true,
      transactionId,
      fee,
    }
  }

  uniqueId(): string {
    return `payment_${this.paymentId}`
  }
}

class SendInvoiceEmailJob extends JobBase implements ShouldQueue {
  public queue = 'emails'
  public connection = 'redis' // Uses default redis connection
  public tries = 3
  public timeout = 30000
  public middleware = [
    middleware.rateLimit(50, 60000), // Max 50 emails per minute
    middleware.skipIf(async () => {
      // Skip if user has unsubscribed
      // eslint-disable-next-line no-console
      console.log(`[SendInvoiceEmailJob] Checking if ${this.userEmail} is subscribed...`)
      return Math.random() < 0.05 // 5% chance to skip
    }),
  ]

  constructor(
    private userEmail: string,
    private invoiceId: string,
    private amount: number
  ) {
    super()
  }

  async handle(): Promise<{ sent: boolean; messageId: string }> {
    // eslint-disable-next-line no-console
    console.log(`[SendInvoiceEmailJob] Sending invoice ${this.invoiceId} to ${this.userEmail}`)
    // eslint-disable-next-line no-console
    console.log(`[SendInvoiceEmailJob] Invoice amount: $${this.amount}`)

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simulate email service failures
    if (Math.random() < 0.1) {
      throw new Error('Email service temporarily unavailable')
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`
    // eslint-disable-next-line no-console
    console.log(`[SendInvoiceEmailJob] ✅ Invoice email sent! Message ID: ${messageId}`)

    return {
      sent: true,
      messageId,
    }
  }

  uniqueId(): string {
    return `invoice_email_${this.invoiceId}_${this.userEmail}`
  }
}

class GenerateReportJob extends JobBase implements ShouldQueue {
  public queue = 'reports'
  public connection = 'redis'
  public tries = 2
  public timeout = 120000 // 2 minutes for heavy reports
  public middleware = [
    middleware.unique(7200), // Unique for 2 hours
    middleware.throttle(3, 300000), // Max 3 reports every 5 minutes
  ]

  constructor(
    private reportType: 'daily' | 'weekly' | 'monthly',
    private dateRange: { from: string; to: string },
    private format: 'pdf' | 'csv' | 'xlsx' = 'pdf'
  ) {
    super()
  }

  async handle(): Promise<{ generated: boolean; downloadUrl: string; fileSize: number }> {
    // eslint-disable-next-line no-console
    console.log(`[GenerateReportJob] Generating ${this.reportType} report`)
    // eslint-disable-next-line no-console
    console.log(`[GenerateReportJob] Date range: ${this.dateRange.from} to ${this.dateRange.to}`)
    // eslint-disable-next-line no-console
    console.log(`[GenerateReportJob] Format: ${this.format}`)

    // Simulate report generation
    const steps = ['Fetching data', 'Processing metrics', 'Generating charts', 'Creating document']
    for (const step of steps) {
      // eslint-disable-next-line no-console
      console.log(`[GenerateReportJob] ${step}...`)
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    // Simulate occasional generation failures
    if (Math.random() < 0.1) {
      throw new Error('Data source temporarily unavailable')
    }

    const fileName = `${this.reportType}_report_${Date.now()}.${this.format}`
    const downloadUrl = `https://reports.example.com/downloads/${fileName}`
    const fileSize = Math.floor(Math.random() * 5000000) + 500000 // 0.5-5.5MB

    // eslint-disable-next-line no-console
    console.log(`[GenerateReportJob] ✅ Report generated! Download: ${downloadUrl}`)

    return {
      generated: true,
      downloadUrl,
      fileSize,
    }
  }

  uniqueId(): string {
    return `${this.reportType}_report_${this.dateRange.from}_${this.dateRange.to}_${this.format}`
  }
}

async function demonstrateAutoConfigLaravel() {
  // eslint-disable-next-line no-console
  console.log('🚀 Laravel-like Queue with Auto-Configuration Demo\n')

  // The queue manager will automatically load configuration from laravel-queue.config.ts
  const queueManager = getQueueManager()

  // eslint-disable-next-line no-console
  console.log('📋 Available connections:', queueManager.getConnections())
  // eslint-disable-next-line no-console
  console.log('🔗 Default connection:', queueManager.getDefaultConnection())
  // eslint-disable-next-line no-console
  console.log('')

  // Get queues from different connections
  const paymentQueue = queueManager.connection('priority').queue('payments')
  const emailQueue = queueManager.connection('redis').queue('emails')
  const reportQueue = queueManager.connection('redis').queue('reports')

  // Start processing jobs
  // eslint-disable-next-line no-console
  console.log('👷 Starting queue workers...\n')

  paymentQueue.processJobs(2) // 2 concurrent payment processors
  emailQueue.processJobs(5)   // 5 concurrent email processors
  reportQueue.processJobs(1)  // 1 report processor (heavy jobs)

  // 1. Individual job dispatching
  // eslint-disable-next-line no-console
  console.log('1. 💳 Dispatching payment jobs:')

  const payment1 = new ProcessPaymentJob('pay_001', 99.99, 'USD')
  const payment2 = new ProcessPaymentJob('pay_002', 249.50, 'EUR')

  await Promise.all([
    dispatch(payment1),
    dispatch(payment2),
  ])
  // eslint-disable-next-line no-console
  console.log('✅ Payment jobs dispatched\n')

  // 2. Chained job dispatching
  // eslint-disable-next-line no-console
  console.log('2. 📧 Dispatching invoice emails with chains:')

  await chain(new SendInvoiceEmailJob('customer1@example.com', 'inv_001', 99.99))
    .delay(5000) // Wait 5 seconds before sending
    .withTries(5)
    .dispatch()

  await chain(new SendInvoiceEmailJob('customer2@example.com', 'inv_002', 249.50))
    .onConnection('priority') // Override to use priority connection
    .dispatch()

  // eslint-disable-next-line no-console
  console.log('✅ Invoice email jobs dispatched\n')

  // 3. Batch job processing
  // eslint-disable-next-line no-console
  console.log('3. 📊 Dispatching report generation batch:')

  const reportBatch = batch('monthly-reports')
    .add(new GenerateReportJob('monthly', { from: '2024-01-01', to: '2024-01-31' }, 'pdf'))
    .add(new GenerateReportJob('monthly', { from: '2024-01-01', to: '2024-01-31' }, 'csv'))
    .add(new GenerateReportJob('weekly', { from: '2024-01-22', to: '2024-01-28' }, 'xlsx'))
    .allowFailures()
    .onConnection('redis')

  const batchResult = await reportBatch.dispatch()
  // eslint-disable-next-line no-console
  console.log(`✅ Report batch dispatched: ${batchResult.total} jobs\n`)

  // 4. High-volume job dispatching
  // eslint-disable-next-line no-console
  console.log('4. 🔄 Dispatching high-volume jobs:')

  const bulkPayments = []
  for (let i = 1; i <= 10; i++) {
    bulkPayments.push(new ProcessPaymentJob(`bulk_${i}`, Math.random() * 500 + 50))
  }

  // Dispatch in smaller batches to respect rate limits
  for (let i = 0; i < bulkPayments.length; i += 3) {
    const batchJobs = bulkPayments.slice(i, i + 3)
    await Promise.all(batchJobs.map(job => dispatch(job)))
    await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second between batches
  }

  // eslint-disable-next-line no-console
  console.log('✅ Bulk payment jobs dispatched\n')

  // 5. Monitor queue statistics
  // eslint-disable-next-line no-console
  console.log('5. 📈 Monitoring queue statistics:\n')

  const monitorInterval = setInterval(async () => {
    try {
      // Get job counts for all queues
      const [paymentCounts, emailCounts, reportCounts] = await Promise.all([
        paymentQueue.getJobCounts(),
        emailQueue.getJobCounts(),
        reportQueue.getJobCounts(),
      ])

      // eslint-disable-next-line no-console
      console.log('📊 Queue Status:')
      // eslint-disable-next-line no-console
      console.log(`   Payments: W:${paymentCounts.waiting} A:${paymentCounts.active} C:${paymentCounts.completed} F:${paymentCounts.failed}`)
      // eslint-disable-next-line no-console
      console.log(`   Emails:   W:${emailCounts.waiting} A:${emailCounts.active} C:${emailCounts.completed} F:${emailCounts.failed}`)
      // eslint-disable-next-line no-console
      console.log(`   Reports:  W:${reportCounts.waiting} A:${reportCounts.active} C:${reportCounts.completed} F:${reportCounts.failed}`)

      const totalActive = paymentCounts.active + emailCounts.active + reportCounts.active
      const totalWaiting = paymentCounts.waiting + emailCounts.waiting + reportCounts.waiting

      if (totalActive === 0 && totalWaiting === 0) {
        // eslint-disable-next-line no-console
        console.log('\n🎉 All jobs completed!')

        // Show final statistics
        const totalCompleted = paymentCounts.completed + emailCounts.completed + reportCounts.completed
        const totalFailed = paymentCounts.failed + emailCounts.failed + reportCounts.failed
        const successRate = ((totalCompleted / (totalCompleted + totalFailed)) * 100).toFixed(1)

        // eslint-disable-next-line no-console
        console.log(`📈 Final Results:`)
        // eslint-disable-next-line no-console
        console.log(`   Total Completed: ${totalCompleted}`)
        // eslint-disable-next-line no-console
        console.log(`   Total Failed: ${totalFailed}`)
        // eslint-disable-next-line no-console
        console.log(`   Success Rate: ${successRate}%`)

        // Cleanup and exit
        clearInterval(monitorInterval)
        await queueManager.closeAll()
        // eslint-disable-next-line no-console
        console.log('\n✅ Queue manager closed, demo complete!')
      }
    }
    catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error monitoring queues:', error)
    }
  }, 3000)

  // Graceful shutdown handler
  process.on('SIGINT', async () => {
    // eslint-disable-next-line no-console
    console.log('\n🛑 Shutting down gracefully...')
    clearInterval(monitorInterval)
    await queueManager.closeAll()
    process.exit(0)
  })

  // eslint-disable-next-line no-console
  console.log('🔍 Monitor will run every 3 seconds. Press Ctrl+C to stop.\n')
}

async function main() {
  try {
    await demonstrateAutoConfigLaravel()
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