import type { LogLevel } from './types'
import { config } from './config'

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

class Logger {
  private level: LogLevel
  private queueName?: string

  constructor(queueName?: string) {
    this.level = config.logLevel || 'info'
    this.queueName = queueName
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }

  private formatMessage(message: string): string {
    const timestamp = new Date().toISOString()
    const prefix = this.queueName ? `[queue:${this.queueName}]` : '[queue]'
    return `${timestamp} ${prefix} ${message}`
  }

  debug(message: string, ...args: any[]): void {
    if (LOG_LEVELS[this.level] <= LOG_LEVELS.debug) {
      console.debug(this.formatMessage(message), ...args)
    }
  }

  info(message: string, ...args: any[]): void {
    if (LOG_LEVELS[this.level] <= LOG_LEVELS.info) {
      console.info(this.formatMessage(message), ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (LOG_LEVELS[this.level] <= LOG_LEVELS.warn) {
      console.warn(this.formatMessage(message), ...args)
    }
  }

  error(message: string, ...args: any[]): void {
    if (LOG_LEVELS[this.level] <= LOG_LEVELS.error) {
      console.error(this.formatMessage(message), ...args)
    }
  }
}

export function createLogger(queueName?: string): Logger {
  return new Logger(queueName)
}

export const logger: Logger = new Logger()
