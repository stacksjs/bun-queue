import { Queue, RateLimiter } from '../packages/bun-queue/src'

interface EmailData {
  userId: string
  to: string
  subject: string
  content: string
}

async function main() {
  console.log('🔒 Key-based Rate Limiting Example')

  // Create an email queue with key-based rate limiting
  const emailQueue = new Queue<EmailData>('emails', {
    verbose: true,
    logLevel: 'info',
  })

  // Create a rate limiter with key-based options
  // This limits each user to 2 emails per 10 seconds
  const emailRateLimiter = new RateLimiter(emailQueue, {
    max: 2, // 2 emails
    duration: 10000, // per 10 seconds
    keyPrefix: 'userId' // Rate limit by userId field
  })

  // Demonstrate sending emails for different users
  const users = ['user1', 'user2', 'user3']

  // Send multiple emails from different users
  for (let i = 0; i < 10; i++) {
    const userId = users[i % users.length]

    // Send email
    console.log(`📧 Attempting to send email #${i+1} for user ${userId}`)

    // Check if rate limited first
    const rateLimitCheck = await emailQueue.isRateLimited(undefined, { userId, to: '', subject: '', content: '' })

    if (rateLimitCheck.limited) {
      console.log(`⛔ Rate limit reached for user ${userId}. Try again in ${rateLimitCheck.resetIn}ms`)
      continue
    }

    // Add job to queue
    const job = await emailQueue.add({
      userId,
      to: `${userId}@example.com`,
      subject: `Test email #${i+1}`,
      content: `This is test email #${i+1} for ${userId}`
    })

    console.log(`✅ Email #${i+1} queued for ${userId} with job ID: ${job.id}`)

    // Wait a bit between requests to see the rate limiting in action
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Process queue with a handler that logs emails
  emailQueue.process(1, async (job) => {
    const { userId, to, subject } = job.data
    console.log(`🚀 Processing email for ${userId} to ${to}: "${subject}"`)

    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 500))

    return { success: true, sentAt: new Date() }
  })

  // Let the queue process for a while
  await new Promise(resolve => setTimeout(resolve, 15000))

  // Close the queue
  await emailQueue.close()
  console.log('👋 Queue closed')
}

main().catch(error => {
  console.error('Error in example:', error)
  process.exit(1)
})
