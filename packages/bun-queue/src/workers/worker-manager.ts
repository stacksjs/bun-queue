import type { QueueManagerConfig } from '../types'
import type { WorkerOptions } from './queue-worker'
import { createLogger } from '../logger'
import { QueueWorker } from './queue-worker'

export class WorkerManager {
  private workers: Map<string, QueueWorker> = new Map()
  private logger = createLogger()

  constructor(private config: QueueManagerConfig) {}

  async startWorker(name: string, options: WorkerOptions = {}): Promise<QueueWorker> {
    if (this.workers.has(name)) {
      throw new Error(`Worker "${name}" is already running`)
    }

    const worker = new QueueWorker(this.config, { ...options, name })

    // Set up event handlers
    worker
      .on('jobProcessing', (job) => {
        this.logger.debug(`[${name}] Processing job ${job.id}`)
      })
      .on('jobProcessed', (job, result) => {
        this.logger.debug(`[${name}] Job ${job.id} completed`)
      })
      .on('jobFailed', (job, error) => {
        this.logger.error(`[${name}] Job ${job.id} failed: ${error.message}`)
      })
      .on('jobRetry', (job) => {
        this.logger.info(`[${name}] Job ${job.id} will be retried`)
      })
      .on('jobTimeout', (job) => {
        this.logger.warn(`[${name}] Job ${job.id} timed out`)
      })
      .on('workerStopping', (status) => {
        this.logger.info(`[${name}] Worker stopping with status ${status}`)
        this.workers.delete(name)
      })

    this.workers.set(name, worker)

    // Start the worker in the background
    worker.work().catch((error) => {
      this.logger.error(`Worker "${name}" crashed:`, error)
      this.workers.delete(name)
    })

    this.logger.info(`Started worker "${name}"`)
    return worker
  }

  async stopWorker(name: string, options: { wait?: boolean } = {}): Promise<boolean> {
    const worker = this.workers.get(name)
    if (!worker) {
      return false
    }

    await worker.stop(0, options)
    this.workers.delete(name)
    this.logger.info(`Stopped worker "${name}"`)
    return true
  }

  async restartWorker(name: string): Promise<boolean> {
    const worker = this.workers.get(name)
    if (!worker) {
      return false
    }

    await worker.restart()
    this.logger.info(`Restarted worker "${name}"`)
    return true
  }

  async stopAllWorkers(options: { wait?: boolean } = {}): Promise<void> {
    const stopPromises = Array.from(this.workers.entries()).map(([name, worker]) =>
      worker.stop(0, options).then(() => {
        this.logger.info(`Stopped worker "${name}"`)
      }),
    )

    await Promise.all(stopPromises)
    this.workers.clear()
    this.logger.info('All workers stopped')
  }

  getWorker(name: string): QueueWorker | undefined {
    return this.workers.get(name)
  }

  getWorkerNames(): string[] {
    return Array.from(this.workers.keys())
  }

  getWorkerStats(): Record<string, any> {
    const stats: Record<string, any> = {}

    for (const [name, worker] of this.workers) {
      stats[name] = worker.getStats()
    }

    return stats
  }

  isWorkerRunning(name: string): boolean {
    return this.workers.has(name)
  }

  getWorkerCount(): number {
    return this.workers.size
  }

  // Queue management commands
  async work(options: WorkerOptions & { name?: string } = {}): Promise<QueueWorker> {
    const name = options.name || `worker_${Date.now()}`
    return this.startWorker(name, options)
  }

  async restart(name?: string): Promise<void> {
    if (name) {
      await this.restartWorker(name)
    }
    else {
      // Restart all workers
      const workerNames = this.getWorkerNames()
      for (const workerName of workerNames) {
        await this.restartWorker(workerName)
      }
    }
  }

  async terminate(name?: string, options: { wait?: boolean } = {}): Promise<void> {
    if (name) {
      await this.stopWorker(name, options)
    }
    else {
      await this.stopAllWorkers(options)
    }
  }

  // Monitor all workers
  monitor(intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(() => {
      const stats = this.getWorkerStats()

      this.logger.info('Worker Status:')
      for (const [name, workerStats] of Object.entries(stats)) {
        this.logger.info(`  ${name}: ${workerStats.jobsProcessed} jobs, ${Math.round(workerStats.runtime / 1000)}s runtime`)
      }

      if (Object.keys(stats).length === 0) {
        this.logger.info('  No workers running')
      }
    }, intervalMs)
  }
}
