import { Queue } from '../packages/bun-queue/src'

interface NotificationData {
  title: string
  message: string
  recipients: string[]
  type: 'email' | 'push' | 'sms'
}

async function main() {
  console.log('🕒 Cron Jobs Example')

  // Create a queue for notifications
  const notificationQueue = new Queue<NotificationData>('notifications', {
    verbose: true,
    logLevel: 'info',
  })

  console.log('✅ Queue created')

  // Process notifications
  notificationQueue.process(5, async (job) => {
    const { title, message, recipients, type } = job.data
    console.log(`📨 Processing ${type} notification "${title}" to ${recipients.length} recipients`)

    // Simulate notification sending
    await new Promise(resolve => setTimeout(resolve, 200))

    return { success: true, sentAt: new Date(), recipientCount: recipients.length }
  })

  console.log('\n📅 Scheduling cron jobs with different expressions:')

  // Example 1: Run every minute - useful for testing
  const everyMinuteId = await notificationQueue.scheduleCron({
    cronExpression: '* * * * *', // Every minute
    data: {
      title: 'Server Status',
      message: 'All systems operational',
      recipients: ['admin@example.com'],
      type: 'email'
    },
    jobId: 'status-check-minute',
    // Will stop after 5 executions
    limit: 5
  })
  console.log(`  - Every minute status check scheduled (ID: ${everyMinuteId})`)

  // Example 2: Hourly job with timezone
  const hourlyJobId = await notificationQueue.scheduleCron({
    cronExpression: '0 * * * *', // At minute 0 of every hour
    timezone: 'America/New_York', // Eastern Time
    data: {
      title: 'Hourly Update',
      message: 'This is your hourly system update',
      recipients: ['team@example.com'],
      type: 'push'
    },
    jobId: 'hourly-update'
  })
  console.log(`  - Hourly update scheduled in Eastern Time (ID: ${hourlyJobId})`)

  // Example 3: Daily job at specific time
  const dailyJobId = await notificationQueue.scheduleCron({
    cronExpression: '30 9 * * *', // Every day at 9:30am
    timezone: 'Europe/London', // London time
    data: {
      title: 'Daily Report',
      message: 'Here is your daily activity report',
      recipients: ['manager@example.com'],
      type: 'email'
    },
    jobId: 'daily-report'
  })
  console.log(`  - Daily report scheduled for 9:30am London time (ID: ${dailyJobId})`)

  // Example 4: Weekday job (Monday through Friday)
  const weekdayJobId = await notificationQueue.scheduleCron({
    cronExpression: '0 8 * * 1-5', // At 8:00am, Monday through Friday
    data: {
      title: 'Morning Briefing',
      message: 'Your tasks for today',
      recipients: ['staff@example.com'],
      type: 'sms'
    },
    jobId: 'weekday-briefing'
  })
  console.log(`  - Weekday briefing scheduled for 8:00am Mon-Fri (ID: ${weekdayJobId})`)

  // Example 5: Complex schedule (first Monday of the month)
  const monthlyJobId = await notificationQueue.scheduleCron({
    cronExpression: '0 12 1-7 * 1', // At 12:00pm on Monday in the first week of the month
    data: {
      title: 'Monthly Review',
      message: 'Time for our monthly performance review',
      recipients: ['executives@example.com'],
      type: 'email'
    },
    jobId: 'monthly-review'
  })
  console.log(`  - Monthly review scheduled for first Monday of each month (ID: ${monthlyJobId})`)

  // Show when the next few minutes of jobs will run
  console.log('\n⏰ Demonstrating minute-by-minute execution for a short period:')
  console.log('   (The every-minute job will run several times)')

  // Wait for several minutes to see some executions
  await new Promise(resolve => setTimeout(resolve, 180000)) // 3 minutes

  // Unschedule one of the jobs to demonstrate cancellation
  console.log('\n❌ Unscheduling the every-minute job')
  const unscheduled = await notificationQueue.unscheduleCron(everyMinuteId)
  console.log(`   Job ${everyMinuteId} ${unscheduled ? 'successfully unscheduled' : 'failed to unschedule'}`)

  // Show the remaining scheduled jobs
  console.log('\n📝 The following jobs remain scheduled:')
  console.log(`  - Hourly update (ID: ${hourlyJobId})`)
  console.log(`  - Daily report (ID: ${dailyJobId})`)
  console.log(`  - Weekday briefing (ID: ${weekdayJobId})`)
  console.log(`  - Monthly review (ID: ${monthlyJobId})`)

  console.log('\n👋 Example completed. In a real application, these would continue running.')
  console.log('   Closing the queue for the example.')

  // In a real application, you might keep the queue running forever
  await notificationQueue.close()
}

main().catch(error => {
  console.error('Error in example:', error)
  process.exit(1)
})
