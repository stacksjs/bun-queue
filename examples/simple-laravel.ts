import {
  JobBase,
  dispatch,
  chain,
  type ShouldQueue,
} from '../packages/bun-queue/src'

// Define a simple job class like Laravel
class SendWelcomeEmailJob extends JobBase implements ShouldQueue {
  public queue = 'emails'
  public tries = 3
  public timeout = 30000

  constructor(
    private userEmail: string,
    private userName: string
  ) {
    super()
  }

  async handle(): Promise<{ sent: boolean; messageId: string }> {
    // eslint-disable-next-line no-console
    console.log(`[SendWelcomeEmailJob] Sending welcome email to ${this.userEmail}`)
    // eslint-disable-next-line no-console
    console.log(`[SendWelcomeEmailJob] User: ${this.userName}`)

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simulate occasional failures
    if (Math.random() < 0.2) {
      throw new Error('Email service temporarily unavailable')
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`
    // eslint-disable-next-line no-console
    console.log(`[SendWelcomeEmailJob] ✅ Email sent successfully! Message ID: ${messageId}`)

    return {
      sent: true,
      messageId,
    }
  }

  uniqueId(): string {
    return `welcome_${this.userEmail}`
  }
}

class ProcessUserAvatarJob extends JobBase implements ShouldQueue {
  public queue = 'images'
  public tries = 2

  constructor(
    private userId: string,
    private imageUrl: string
  ) {
    super()
  }

  async handle(): Promise<{ processed: boolean; thumbnailUrl: string }> {
    // eslint-disable-next-line no-console
    console.log(`[ProcessUserAvatarJob] Processing avatar for user ${this.userId}`)
    // eslint-disable-next-line no-console
    console.log(`[ProcessUserAvatarJob] Image URL: ${this.imageUrl}`)

    // Simulate image processing
    await new Promise(resolve => setTimeout(resolve, 1500))

    const thumbnailUrl = `https://cdn.example.com/avatars/${this.userId}_thumb.jpg`
    // eslint-disable-next-line no-console
    console.log(`[ProcessUserAvatarJob] ✅ Avatar processed! Thumbnail: ${thumbnailUrl}`)

    return {
      processed: true,
      thumbnailUrl,
    }
  }

  uniqueId(): string {
    return `avatar_${this.userId}`
  }
}

async function demonstrateLaravelAPI() {
  // eslint-disable-next-line no-console
  console.log('🚀 Laravel-like Queue API Demo\n')

  // 1. Basic job dispatching (Laravel style)
  // eslint-disable-next-line no-console
  console.log('1. Basic job dispatching:')
  const emailJob = new SendWelcomeEmailJob('john@example.com', 'John Doe')
  const dispatchedEmailJob = await dispatch(emailJob)
  // eslint-disable-next-line no-console
  console.log(`✅ Email job dispatched with ID: ${dispatchedEmailJob.id}\n`)

  // 2. Fluent job chaining (Laravel style)
  // eslint-disable-next-line no-console
  console.log('2. Fluent job chaining:')
  await chain(new SendWelcomeEmailJob('jane@example.com', 'Jane Smith'))
    .onQueue('priority-emails')
    .withTries(5)
    .delay(2000) // 2 second delay
    .dispatch()
  // eslint-disable-next-line no-console
  console.log('✅ Priority email job queued with delay and custom tries\n')

  // 3. Multiple jobs with different configurations
  // eslint-disable-next-line no-console
  console.log('3. Multiple jobs with different configurations:')

  // Create jobs with method chaining
  const avatarJob = new ProcessUserAvatarJob('user123', 'https://example.com/avatar.jpg')
    .withTries(3)
    .withTimeout(60000)

  const marketingEmail = new SendWelcomeEmailJob('marketing@example.com', 'Marketing Team')
    .onQueue('marketing-emails')
    .withTries(1)

  // Dispatch them
  await Promise.all([
    dispatch(avatarJob),
    dispatch(marketingEmail),
  ])

  // eslint-disable-next-line no-console
  console.log('✅ Avatar processing and marketing email jobs dispatched\n')

  // 4. Conditional dispatching
  // eslint-disable-next-line no-console
  console.log('4. Conditional dispatching:')
  const isNewUser = Math.random() > 0.5
  const welcomeJob = new SendWelcomeEmailJob('newuser@example.com', 'New User')

  if (isNewUser) {
    await dispatch(welcomeJob)
    // eslint-disable-next-line no-console
    console.log('✅ Welcome email dispatched for new user')
  }
else {
    // eslint-disable-next-line no-console
    console.log('ℹ️  User not new, skipping welcome email')
  }

  // eslint-disable-next-line no-console
  console.log('\n🎉 Demo completed! Jobs are now being processed...')
  // eslint-disable-next-line no-console
  console.log('Note: In a real application, you would start workers to process these jobs.')
}

// Simple worker simulation for demo purposes
async function simulateWorkers() {
  // eslint-disable-next-line no-console
  console.log('\n👷 Starting simulated workers...\n')

  // This is just for demo - in reality you'd use the actual queue processing
  const jobs = [
    new SendWelcomeEmailJob('demo@example.com', 'Demo User'),
    new ProcessUserAvatarJob('demo123', 'https://example.com/demo.jpg'),
  ]

  for (const job of jobs) {
    try {
      // eslint-disable-next-line no-console
      console.log(`🔄 Processing ${job.constructor.name}...`)
      const result = await job.handle()
      // eslint-disable-next-line no-console
      console.log(`✅ Job completed:`, result)
    }
catch (error) {
      // eslint-disable-next-line no-console
      console.log(`❌ Job failed:`, (error as Error).message)
    }
    // eslint-disable-next-line no-console
    console.log('') // Empty line for readability
  }
}

async function main() {
  await demonstrateLaravelAPI()
  await simulateWorkers()
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('❌ Demo failed:', error)
  process.exit(1)
})