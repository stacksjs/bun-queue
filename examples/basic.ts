import { Queue } from '../packages/bun-queue/src'

// Define job data type
interface EmailJob {
  to: string
  subject: string
  body: string
}

async function main() {
  // Create email queue
  const emailQueue = new Queue<EmailJob>('emails')

  // Add 5 jobs to the queue
  for (let i = 1; i <= 5; i++) {
    const job = await emailQueue.add({
      to: `user${i}@example.com`,
      subject: `Email ${i}`,
      body: `This is test email #${i}`,
    }, {
      delay: i * 1000, // Each job delayed by 1 second more than the previous
      attempts: 3,
    })

    console.log(`Added job ${job.id} to the queue`)
  }

  // Process jobs with concurrency of 2
  emailQueue.process(2, async (job) => {
    const { to, subject, body } = job.data

    console.log(`Processing email to ${to}`)

    // Update progress
    await job.updateProgress(25)
    console.log(`[${job.id}] Started processing...`)

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 2000))

    await job.updateProgress(50)
    console.log(`[${job.id}] Sending email...`)

    // Simulate more work
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Randomly fail some jobs to demonstrate retry
    if (Math.random() < 0.3) {
      throw new Error('Failed to send email')
    }

    await job.updateProgress(100)
    console.log(`[${job.id}] Email sent successfully to ${to}`)

    return { sent: true, timestamp: Date.now() }
  })

  // Display job counts every second
  const interval = setInterval(async () => {
    const counts = await emailQueue.getJobCounts()
    console.log(counts)

    // Stop after 30 seconds
    if (counts.completed + counts.failed === 5) {
      clearInterval(interval)
      await emailQueue.close()
      console.log('All jobs processed, exiting...')
    }
  }, 1000)
}

main().catch(console.error)
