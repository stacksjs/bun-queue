import type { QueueEvents } from './types'
import { EventEmitter } from 'node:events'
import { createLogger } from './logger'

class JobEvents extends EventEmitter {
  private readonly logger = createLogger('events')
  private readonly queueName: string

  constructor(queueName: string) {
    super()
    this.queueName = queueName
    this.logger.debug(`Event emitter created for queue ${queueName}`)
  }

  /**
   * Emit a job added event
   */
  emitJobAdded(jobId: string, name: string): void {
    this.logger.debug(`Job ${jobId} added to queue ${this.queueName}`)
    this.emit('jobAdded', jobId, name)
  }

  /**
   * Emit a job removed event
   */
  emitJobRemoved(jobId: string): void {
    this.logger.debug(`Job ${jobId} removed from queue ${this.queueName}`)
    this.emit('jobRemoved', jobId)
  }

  /**
   * Emit a job completed event
   */
  emitJobCompleted(jobId: string, result: any): void {
    this.logger.debug(`Job ${jobId} completed in queue ${this.queueName}`)
    this.emit('jobCompleted', jobId, result)
  }

  /**
   * Emit a job failed event
   */
  emitJobFailed(jobId: string, error: Error): void {
    this.logger.debug(`Job ${jobId} failed in queue ${this.queueName}: ${error.message}`)
    this.emit('jobFailed', jobId, error)
  }

  /**
   * Emit a job progress event
   */
  emitJobProgress(jobId: string, progress: number): void {
    this.logger.debug(`Job ${jobId} progress: ${progress}%`)
    this.emit('jobProgress', jobId, progress)
  }

  /**
   * Emit a job active event
   */
  emitJobActive(jobId: string): void {
    this.logger.debug(`Job ${jobId} is now active`)
    this.emit('jobActive', jobId)
  }

  /**
   * Emit a job stalled event
   */
  emitJobStalled(jobId: string): void {
    this.logger.debug(`Job ${jobId} has stalled`)
    this.emit('jobStalled', jobId)
  }

  /**
   * Emit a job delayed event
   */
  emitJobDelayed(jobId: string, delay: number): void {
    this.logger.debug(`Job ${jobId} delayed by ${delay}ms`)
    this.emit('jobDelayed', jobId, delay)
  }

  /**
   * Emit a ready event
   */
  emitReady(): void {
    this.logger.debug(`Queue ${this.queueName} is ready`)
    this.emit('ready')
  }

  /**
   * Emit an error event
   */
  emitError(error: Error): void {
    this.logger.error(`Queue ${this.queueName} error: ${error.message}`)
    this.emit('error', error)
  }
}

export { JobEvents }
