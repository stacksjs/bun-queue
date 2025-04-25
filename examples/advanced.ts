import { Queue, RateLimiter } from '../packages/bun-queue/src'

// Define job data types
interface EmailJob {
  to: string
  subject: string
  body: string
}

interface ReportJob {
  reportId: string
  userId: string
  format: 'pdf' | 'csv' | 'xlsx'
}

interface ImageJob {
  imageId: string
  operations: Array<{
    type: 'resize' | 'crop' | 'filter'
    params: Record<string, any>
  }>
}

async function main() {
  // Create queues for different job types
  const emailQueue = new Queue<EmailJob>('emails', {
    verbose: true,
    logLevel: 'info',
    metrics: { enabled: true },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  })

  const reportQueue = new Queue<ReportJob>('reports')
  const imageQueue = new Queue<ImageJob>('images')

  // Set up event listeners for the email queue
  emailQueue.events.on('jobCompleted', (jobId, result) => {
    console.log(`Email job ${jobId} completed with result:`, result)
  })

  emailQueue.events.on('jobFailed', (jobId, error) => {
    console.log(`Email job ${jobId} failed with error:`, error.message)
  })

  // Create a rate limiter for the email queue (5 emails per second)
  const emailRateLimiter = new RateLimiter(emailQueue, {
    max: 5,
    duration: 1000,
  })

  // Add jobs with dependencies
  // First, add a report generation job
  const reportJob = await reportQueue.add({
    reportId: 'report-123',
    userId: 'user-456',
    format: 'pdf',
  }, {
    attempts: 2,
    jobId: 'report-job-123',
  })

  console.log(`Added report job ${reportJob.id}`)

  // Then, add an email job that depends on the report job
  const emailJobWithDep = await emailQueue.add({
    to: 'user@example.com',
    subject: 'Your report is ready',
    body: 'Please find your report attached.',
  }, {
    dependsOn: reportJob.id, // This job won't process until the report job is done
    jobId: 'email-job-123',
  })

  console.log(`Added email job ${emailJobWithDep.id} depending on report job ${reportJob.id}`)

  // Add some image processing jobs
  for (let i = 1; i <= 3; i++) {
    const imageJob = await imageQueue.add({
      imageId: `image-${i}`,
      operations: [
        { type: 'resize', params: { width: 800, height: 600 } },
        { type: 'filter', params: { name: 'grayscale' } },
      ],
    }, {
      priority: i, // Higher number = higher priority
    })

    console.log(`Added image job ${imageJob.id} with priority ${i}`)
  }

  // Add some rate-limited email jobs
  for (let i = 1; i <= 10; i++) {
    // Check rate limiter before adding the job
    const { limited, remaining, resetIn } = await emailRateLimiter.check()

    if (!limited) {
      const job = await emailQueue.add({
        to: `user${i}@example.com`,
        subject: `Test Email ${i}`,
        body: `This is test email #${i}`,
      })

      console.log(`Added rate-limited email job ${job.id}. Remaining: ${remaining}`)
    }
    else {
      console.log(`Rate limit reached. Try again in ${resetIn}ms. Skipping email ${i}.`)
      // In a real app, you might wait and retry, or queue locally
      await new Promise(resolve => setTimeout(resolve, 500))
      i-- // Try again
    }
  }

  // Process report jobs
  reportQueue.process(2, async (job) => {
    console.log(`Processing report job ${job.id} for report ${job.data.reportId}`)

    // Update progress
    await job.updateProgress(25)

    // Simulate report generation work
    await new Promise(resolve => setTimeout(resolve, 2000))

    await job.updateProgress(75)

    // More processing
    await new Promise(resolve => setTimeout(resolve, 1000))

    await job.updateProgress(100)
    console.log(`Report ${job.data.reportId} generated successfully`)

    return { reportUrl: `https://example.com/reports/${job.data.reportId}.${job.data.format}` }
  })

  // Process email jobs
  emailQueue.process(5, async (job) => {
    console.log(`Processing email job ${job.id} to ${job.data.to}`)

    // Update progress
    await job.updateProgress(50)

    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Randomly fail some jobs to demonstrate retry
    if (Math.random() < 0.3) {
      throw new Error('Failed to send email: SMTP error')
    }

    await job.updateProgress(100)
    console.log(`Email sent successfully to ${job.data.to}`)

    return {
      sent: true,
      messageId: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }
  })

  // Process image jobs
  imageQueue.process(3, async (job) => {
    console.log(`Processing image job ${job.id} for image ${job.data.imageId}`)

    // Update progress
    await job.updateProgress(25)

    // For each operation
    for (const [index, operation] of job.data.operations.entries()) {
      console.log(`Applying ${operation.type} to image ${job.data.imageId}`)

      // Simulate image processing work
      await new Promise(resolve => setTimeout(resolve, 1000))

      const progressIncrement = 75 / job.data.operations.length
      await job.updateProgress(25 + progressIncrement * (index + 1))
    }

    await job.updateProgress(100)
    console.log(`Image ${job.data.imageId} processed successfully`)

    return {
      imageUrl: `https://example.com/images/${job.data.imageId}-processed.jpg`,
      operations: job.data.operations.length,
    }
  })

  // Display job counts and metrics periodically
  const interval = setInterval(async () => {
    // Get counts for all queues
    const [emailCounts, reportCounts, imageCounts] = await Promise.all([
      emailQueue.getJobCounts(),
      reportQueue.getJobCounts(),
      imageQueue.getJobCounts(),
    ])

    console.log('\nJob Counts:')
    console.log('Email Queue:', emailCounts)
    console.log('Report Queue:', reportCounts)
    console.log('Image Queue:', imageCounts)

    // Get metrics
    const metrics = await emailQueue.getMetrics()
    if (metrics) {
      console.log('\nEmail Queue Metrics:')
      console.log(`Processed per minute: ${metrics.jobsProcessedPerMinute}`)
      console.log(`Added per minute: ${metrics.jobsAddedPerMinute}`)
      console.log(`Error rate: ${(metrics.errorRate * 100).toFixed(1)}%`)
      console.log(`Avg processing time: ${metrics.processingTime.avg.toFixed(0)}ms`)
    }

    // Check if all jobs are completed or failed
    const totalActive = emailCounts.active + reportCounts.active + imageCounts.active
    const totalWaiting = emailCounts.waiting + reportCounts.waiting + imageCounts.waiting
    const totalDelayed = emailCounts.delayed + reportCounts.delayed + imageCounts.delayed

    if (totalActive === 0 && totalWaiting === 0 && totalDelayed === 0) {
      console.log('\nAll jobs processed!')

      // Display final results
      const completed = emailCounts.completed + reportCounts.completed + imageCounts.completed
      const failed = emailCounts.failed + reportCounts.failed + imageCounts.failed
      console.log(`Total completed: ${completed}`)
      console.log(`Total failed: ${failed}`)

      // Clean up
      clearInterval(interval)

      // Close all queues
      await Promise.all([
        emailQueue.close(),
        reportQueue.close(),
        imageQueue.close(),
      ])

      console.log('All queues closed, exiting...')
    }
  }, 2000)
}

main().catch(console.error)
