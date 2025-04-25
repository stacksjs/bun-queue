import { PriorityQueue, type Job } from '../packages/bun-queue/src'

interface TaskData {
  name: string
  duration: number
  importance: number
}

async function main() {
  console.log('🚀 Priority Queue Example')

  // Create a priority queue with 5 priority levels (0-4) and dynamic reordering
  const taskQueue = new PriorityQueue<TaskData>('tasks', {
    levels: 5,
    defaultLevel: 1,
    dynamicReordering: true,
    reorderInterval: 2000,
  })

  console.log('✅ Queue created with 5 priority levels')

  // Add some tasks with different priorities
  const tasks = [
    { name: 'Low priority task 1', duration: 500, importance: 1 },
    { name: 'Medium priority task', duration: 300, importance: 5 },
    { name: 'High priority task', duration: 200, importance: 8 },
    { name: 'Critical task', duration: 100, importance: 10 },
    { name: 'Low priority task 2', duration: 400, importance: 2 },
  ]

  console.log('📝 Adding tasks with different priorities...')

  // Add tasks with priorities mapped from their importance
  for (const task of tasks) {
    // Map importance (1-10) to priority levels (0-4)
    const priority = Math.min(Math.floor(task.importance / 2.5), 4)
    await taskQueue.add(task, { priority })
    console.log(`  - Added "${task.name}" with priority ${priority}`)
  }

  console.log('\n📊 Current job counts:')
  const counts = await taskQueue.getJobCounts()
  console.log(counts)

  // Process tasks in order of priority
  console.log('\n🔄 Processing tasks in priority order:')
  taskQueue.process(1, async (job: Job<TaskData>) => {
    const { name, duration } = job.data
    const priority = job.opts.priority

    console.log(`⏳ Starting "${name}" (priority: ${priority})`)

    // Simulate processing by waiting for the duration
    await new Promise(resolve => setTimeout(resolve, duration))

    console.log(`✅ Completed "${name}" (priority: ${priority})`)

    return { success: true, processedAt: new Date() }
  })

  // Let's add a new highest priority task during processing
  setTimeout(async () => {
    console.log('\n🚨 Adding emergency task with highest priority (4)!')
    await taskQueue.add(
      { name: 'EMERGENCY TASK', duration: 50, importance: 10 },
      { priority: 4 }
    )
  }, 600)

  // Wait for all jobs to complete
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Close the queue
  await taskQueue.close()
  console.log('\n👋 All tasks completed, queue closed')
}

main().catch(console.error)
