import type { Queue } from './queue'

export interface QueueMetrics {
  completed: number[]
  failed: number[]
  delayed: number[]
  active: number[]
  waiting: number[]
  added: number
  processedRate: number
}

export class Metrics {
  private queue: Queue
  private collectInterval: number
  private intervalId: number | null = null
  private metrics: QueueMetrics = {
    completed: [],
    failed: [],
    delayed: [],
    active: [],
    waiting: [],
    added: 0,
    processedRate: 0,
  }

  constructor(queue: Queue) {
    this.queue = queue
    this.collectInterval = 30000 // Default 30 seconds
    this.startCollecting()
  }

  /**
   * Start collecting metrics at regular intervals
   */
  private startCollecting(): void {
    // Clear existing interval if any
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    // Set up new collection interval
    this.intervalId = setInterval(async () => {
      await this.collectMetrics()
    }, this.collectInterval) as unknown as number
  }

  /**
   * Stop collecting metrics
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Collect current metrics from Redis
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Get current job counts
      const counts = await this.queue.getJobCounts()

      // Update metrics with current counts
      this.metrics.completed.unshift(counts.completed)
      this.metrics.failed.unshift(counts.failed)
      this.metrics.delayed.unshift(counts.delayed)
      this.metrics.active.unshift(counts.active)
      this.metrics.waiting.unshift(counts.waiting)

      // Keep only the last 100 data points for each metric
      const maxDataPoints = 100
      this.metrics.completed = this.metrics.completed.slice(0, maxDataPoints)
      this.metrics.failed = this.metrics.failed.slice(0, maxDataPoints)
      this.metrics.delayed = this.metrics.delayed.slice(0, maxDataPoints)
      this.metrics.active = this.metrics.active.slice(0, maxDataPoints)
      this.metrics.waiting = this.metrics.waiting.slice(0, maxDataPoints)

      // Calculate processing rate (jobs per minute)
      const totalProcessed = counts.completed + counts.failed
      const elapsedMinutes = this.collectInterval / 60000
      this.metrics.processedRate = totalProcessed / elapsedMinutes
    }
    catch (err) {
      console.error('Error collecting metrics:', err)
    }
  }

  /**
   * Track a job being added to the queue
   */
  trackJobAdded(): void {
    this.metrics.added++
  }

  /**
   * Get the current metrics
   */
  async getMetrics(): Promise<QueueMetrics> {
    // Collect fresh metrics before returning
    await this.collectMetrics()
    return { ...this.metrics }
  }
}
