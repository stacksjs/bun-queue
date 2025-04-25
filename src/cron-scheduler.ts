import type { Queue } from './queue'
import type { JobOptions } from './types'
import { createLogger } from './logger'
import { generateId } from './utils'

/**
 * CronSchedule represents the parsed cron expression
 */
interface CronSchedule {
  minute: number[] | null
  hour: number[] | null
  dayOfMonth: number[] | null
  month: number[] | null
  dayOfWeek: number[] | null
}

/**
 * Options for a cron job
 */
export interface CronJobOptions extends Omit<JobOptions, 'repeat'> {
  /**
   * Cron expression in standard format (e.g. "0 0 * * *" for daily at midnight)
   */
  cronExpression: string

  /**
   * Timezone for the cron expression (e.g. "America/New_York")
   */
  timezone?: string

  /**
   * Job data template
   */
  data: any

  /**
   * Start date for the cron job
   */
  startDate?: Date | number

  /**
   * End date for the cron job (after which it won't run anymore)
   */
  endDate?: Date | number

  /**
   * Maximum number of times this job should run
   */
  limit?: number
}

/**
 * Class that handles scheduling jobs based on cron expressions
 */
export class CronScheduler {
  private readonly queue: Queue
  private readonly logger = createLogger('cron')
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map()

  constructor(queue: Queue) {
    this.queue = queue
  }

  /**
   * Schedule a job with a cron expression
   * @param options Options including the cron expression and job data
   * @returns The ID of the scheduled job
   */
  async schedule(options: CronJobOptions): Promise<string> {
    const jobId = options.jobId || generateId()
    const cronExpression = options.cronExpression

    try {
      // Parse the cron expression
      const schedule = this.parseCronExpression(cronExpression)

      // Calculate the next execution time
      const now = new Date()
      const nextRun = this.getNextExecutionTime(schedule, now, options.timezone)

      if (!nextRun) {
        throw new Error(`Invalid cron expression: ${cronExpression}`)
      }

      // Create a job with repeat options
      const jobOptions: JobOptions = {
        ...options,
        jobId,
        repeat: {
          cron: cronExpression,
          tz: options.timezone,
          startDate: options.startDate,
          endDate: options.endDate,
          limit: options.limit,
          // Need to specify 'every' for backward compatibility
          every: 0, // This value is ignored when cron is specified
        },
      }

      // Calculate delay until next execution
      const delay = nextRun.getTime() - now.getTime()
      jobOptions.delay = delay > 0 ? delay : 0

      // Add the job to the queue
      await this.queue.add(options.data, jobOptions)

      this.logger.info(`Scheduled cron job ${jobId} with expression "${cronExpression}", next run at ${nextRun.toLocaleString()}`)

      return jobId
    }
    catch (error) {
      this.logger.error(`Error scheduling cron job: ${(error as Error).message}`)
      throw error
    }
  }

  /**
   * Parse a cron expression into a schedule
   * @param expression The cron expression (e.g. "0 0 * * *")
   * @returns Parsed schedule
   */
  private parseCronExpression(expression: string): CronSchedule {
    const parts = expression.trim().split(/\s+/)

    if (parts.length !== 5) {
      throw new Error(`Invalid cron expression: ${expression}. Must have 5 parts.`)
    }

    return {
      minute: this.parseField(parts[0], 0, 59),
      hour: this.parseField(parts[1], 0, 23),
      dayOfMonth: this.parseField(parts[2], 1, 31),
      month: this.parseField(parts[3], 1, 12),
      dayOfWeek: this.parseField(parts[4], 0, 6),
    }
  }

  /**
   * Parse a single field of a cron expression
   * @param field The field to parse (e.g. "1-5", "*\/2", "1,3,5")
   * @param min The minimum value
   * @param max The maximum value
   * @returns Array of valid values or null for all values
   */
  private parseField(field: string, min: number, max: number): number[] | null {
    // Handle all values wildcard
    if (field === '*') {
      return null // Null means all values are valid
    }

    const values = new Set<number>()

    // Handle multiple comma-separated values
    const parts = field.split(',')

    for (const part of parts) {
      // Handle ranges (e.g. "1-5")
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => Number.parseInt(n, 10))

        if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
          throw new Error(`Invalid range in cron expression: ${part}`)
        }

        for (let i = start; i <= end; i++) {
          values.add(i)
        }
      }
      // Handle steps (e.g. "*/2", "1/2")
      else if (part.includes('/')) {
        const [range, step] = part.split('/')
        const stepValue = Number.parseInt(step, 10)

        if (isNaN(stepValue) || stepValue <= 0) {
          throw new Error(`Invalid step in cron expression: ${part}`)
        }

        let start = min
        const end = max

        if (range !== '*') {
          const rangeValue = Number.parseInt(range, 10)
          if (!isNaN(rangeValue)) {
            start = rangeValue
          }
        }

        for (let i = start; i <= end; i += stepValue) {
          values.add(i)
        }
      }
      // Handle single values
      else {
        const value = Number.parseInt(part, 10)

        if (isNaN(value) || value < min || value > max) {
          throw new Error(`Invalid value in cron expression: ${part}`)
        }

        values.add(value)
      }
    }

    return Array.from(values).sort((a, b) => a - b)
  }

  /**
   * Get the next execution time for a cron schedule
   * @param schedule The parsed cron schedule
   * @param now The current date
   * @param timezone Optional timezone
   * @returns The next execution time or null if invalid
   */
  private getNextExecutionTime(schedule: CronSchedule, now: Date, timezone?: string): Date | null {
    // Create a copy of current date to avoid modifying the input
    const date = new Date(now.getTime())

    // Apply timezone if specified
    if (timezone) {
      try {
        // Format the date to the specified timezone
        const options: Intl.DateTimeFormatOptions = {
          timeZone: timezone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: false,
        }

        const formatter = new Intl.DateTimeFormat('en-US', options)
        const parts = formatter.formatToParts(date)

        const getValue = (type: string): number => {
          const part = parts.find(p => p.type === type)
          return part ? Number.parseInt(part.value, 10) : 0
        }

        const year = getValue('year')
        const month = getValue('month') - 1 // JavaScript months are 0-based
        const day = getValue('day')
        const hour = getValue('hour')
        const minute = getValue('minute')

        // Create a new date in the target timezone
        date.setFullYear(year, month, day)
        date.setHours(hour, minute, 0, 0)
      }
      catch (error) {
        this.logger.warn(`Invalid timezone: ${timezone}, using system timezone`)
      }
    }

    // Start from the next minute
    date.setSeconds(0, 0)
    date.setMinutes(date.getMinutes() + 1)

    // Find the next execution time
    const maxIterations = 1000 // Prevent infinite loops
    for (let i = 0; i < maxIterations; i++) {
      // Check if month matches
      if (schedule.month !== null && !schedule.month.includes(date.getMonth() + 1)) {
        // Skip to the next month
        date.setMonth(date.getMonth() + 1)
        date.setDate(1)
        date.setHours(0, 0, 0, 0)
        continue
      }

      // Check if day of month matches
      if (schedule.dayOfMonth !== null && !schedule.dayOfMonth.includes(date.getDate())) {
        // Skip to the next day
        date.setDate(date.getDate() + 1)
        date.setHours(0, 0, 0, 0)
        continue
      }

      // Check if day of week matches
      if (schedule.dayOfWeek !== null) {
        const dayOfWeek = date.getDay()
        if (!schedule.dayOfWeek.includes(dayOfWeek)) {
          // Skip to the next day
          date.setDate(date.getDate() + 1)
          date.setHours(0, 0, 0, 0)
          continue
        }
      }

      // Check if hour matches
      if (schedule.hour !== null && !schedule.hour.includes(date.getHours())) {
        // Skip to the next hour
        date.setHours(date.getHours() + 1, 0, 0, 0)
        continue
      }

      // Check if minute matches
      if (schedule.minute !== null && !schedule.minute.includes(date.getMinutes())) {
        // Skip to the next minute
        date.setMinutes(date.getMinutes() + 1, 0, 0)
        continue
      }

      // All fields match, we found the next execution time
      return date
    }

    this.logger.error('Failed to find next execution time after too many iterations')
    return null
  }

  /**
   * Unschedule a job by ID
   * @param jobId The ID of the job to unschedule
   */
  async unschedule(jobId: string): Promise<boolean> {
    try {
      // Remove job from queue
      await this.queue.removeJob(jobId)

      // Clean up timeout if exists
      if (this.scheduledJobs.has(jobId)) {
        clearTimeout(this.scheduledJobs.get(jobId))
        this.scheduledJobs.delete(jobId)
      }

      this.logger.info(`Unscheduled cron job ${jobId}`)
      return true
    }
    catch (error) {
      this.logger.error(`Error unscheduling cron job ${jobId}: ${(error as Error).message}`)
      return false
    }
  }
}
