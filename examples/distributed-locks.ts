import { Queue, DistributedLock } from '../packages/bun-queue/src'

interface TaskData {
  id: string
  duration: number
  requiresExclusiveAccess: boolean
}

// Create shared resources that multiple workers might access
const sharedCounter = {
  value: 0,
  increment() {
    // Simulate a non-atomic operation that could cause race conditions
    const current = this.value
    // Simulate some processing time where race conditions could occur
    setTimeout(() => {}, 10)
    this.value = current + 1
    return this.value
  }
}

async function main() {
  console.log('🔒 Distributed Locks Example')

  // Create a task queue with distributed lock support enabled
  const taskQueue = new Queue<TaskData>('tasks', {
    verbose: true,
    logLevel: 'info',
    distributedLock: true  // Enable distributed locks
  })

  // Get the lock instance for manual locking operations
  const lock = taskQueue.getLock()

  if (!lock) {
    console.error('Distributed lock not available!')
    return
  }

  console.log('✅ Queue created with distributed lock support')

  // Add some tasks, some requiring exclusive access
  const tasks = [
    { id: 'task1', duration: 500, requiresExclusiveAccess: true },
    { id: 'task2', duration: 300, requiresExclusiveAccess: false },
    { id: 'task3', duration: 200, requiresExclusiveAccess: true },
    { id: 'task4', duration: 400, requiresExclusiveAccess: false },
    { id: 'task5', duration: 100, requiresExclusiveAccess: true },
  ]

  console.log('📝 Adding tasks...')

  // Add all tasks to the queue
  for (const task of tasks) {
    await taskQueue.add(task, { jobId: task.id })
    console.log(`  - Added "${task.id}" (requires lock: ${task.requiresExclusiveAccess})`)
  }

  console.log('\n📊 Current job counts:')
  const counts = await taskQueue.getJobCounts()
  console.log(counts)

  // Process tasks with multiple concurrent workers
  console.log('\n🔄 Processing tasks with distributed locks:')

  // Start multiple workers to simulate a distributed system
  taskQueue.process(3, async (job) => {
    const { id, duration, requiresExclusiveAccess } = job.data

    console.log(`⏳ Worker starting "${id}" (requires lock: ${requiresExclusiveAccess})`)

    let result

    if (requiresExclusiveAccess) {
      // For tasks requiring exclusive access, we manually acquire a lock on a shared resource
      const resourceName = 'shared-resource'
      console.log(`🔒 Acquiring lock for "${resourceName}" for task "${id}"`)

      // Try to acquire the lock
      const token = await lock.acquire(resourceName, {
        duration: duration * 2, // Lock timeout
        retries: 3,             // Number of retries if lock not available
        retryDelay: 100         // Delay between retries
      })

      if (!token) {
        console.error(`❌ Failed to acquire lock for "${id}"`)
        throw new Error('Failed to acquire lock')
      }

      try {
        console.log(`🔓 Lock acquired for "${id}" - processing with exclusive access`)

        // Simulate processing with exclusive access to shared resource
        const beforeValue = sharedCounter.value
        await new Promise(resolve => setTimeout(resolve, duration))
        const afterValue = sharedCounter.increment()

        result = {
          success: true,
          processedAt: new Date(),
          counterBefore: beforeValue,
          counterAfter: afterValue
        }

        console.log(`✅ Task "${id}" completed with exclusive access, counter: ${afterValue}`)
      } finally {
        // Always release the lock when done
        await lock.release(resourceName, token)
        console.log(`🔓 Lock released for "${id}"`)
      }
    } else {
      // Non-exclusive tasks can run without manual locking
      // They're still protected from concurrent processing of the same job
      // by the built-in distributed job lock
      console.log(`⚙️ Processing "${id}" without exclusive resource access`)

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, duration))

      result = {
        success: true,
        processedAt: new Date(),
        noLockRequired: true
      }

      console.log(`✅ Task "${id}" completed (no exclusive access needed)`)
    }

    return result
  })

  // Wait for all jobs to complete
  await new Promise(resolve => setTimeout(resolve, 5000))

  // Check final counter value
  console.log(`\n📊 Final shared counter value: ${sharedCounter.value}`)

  // Close the queue
  await taskQueue.close()
  console.log('\n👋 All tasks completed, queue closed')
}

main().catch(console.error)
