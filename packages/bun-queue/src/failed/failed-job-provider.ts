/* eslint-disable no-console */

export interface FailedJob {
  id: string
  connection: string
  queue: string
  payload: string
  exception: string
  failed_at: Date
}

export interface FailedJobProvider {
  log: (connection: string, queue: string, payload: string, exception: Error) => Promise<string>
  all: () => Promise<FailedJob[]>
  find: (id: string) => Promise<FailedJob | null>
  forget: (id: string) => Promise<boolean>
  flush: (hours?: number) => Promise<void>
  prune: (hours: number) => Promise<number>
}

export class RedisFailedJobProvider implements FailedJobProvider {
  private prefix: string

  constructor(prefix: string = 'failed_jobs') {
    this.prefix = prefix
  }

  async log(_connection: string, _queue: string, _payload: string, _exception: Error): Promise<string> {
    const id = `failed_${Date.now()}_${Math.random().toString(36).substring(2)}`

    const _failedJob: FailedJob = {
      id,
      connection: _connection,
      queue: _queue,
      payload: _payload,
      exception: _exception.stack || _exception.message,
      failed_at: new Date(),
    }

    // In a real implementation, store in Redis
    console.log(`[FailedJobProvider] Logged failed job ${id} from queue ${queue}`)

    return id
  }

  async all(): Promise<FailedJob[]> {
    // In a real implementation, fetch from Redis
    console.log(`[FailedJobProvider] Fetching all failed jobs`)
    return []
  }

  async find(id: string): Promise<FailedJob | null> {
    // In a real implementation, fetch specific job from Redis
    console.log(`[FailedJobProvider] Finding failed job ${id}`)
    return null
  }

  async forget(id: string): Promise<boolean> {
    // In a real implementation, remove from Redis
    console.log(`[FailedJobProvider] Forgetting failed job ${id}`)
    return true
  }

  async flush(hours?: number): Promise<void> {
    // In a real implementation, remove all or old failed jobs from Redis
    const timeframe = hours ? `older than ${hours} hours` : 'all'
    console.log(`[FailedJobProvider] Flushing ${timeframe} failed jobs`)
  }

  async prune(hours: number): Promise<number> {
    // In a real implementation, remove failed jobs older than X hours
    console.log(`[FailedJobProvider] Pruning failed jobs older than ${hours} hours`)
    return 0
  }
}

export class DatabaseFailedJobProvider implements FailedJobProvider {
  private table: string

  constructor(table: string = 'failed_jobs') {
    this.table = table
  }

  async log(_connection: string, _queue: string, _payload: string, _exception: Error): Promise<string> {
    const id = `failed_${Date.now()}_${Math.random().toString(36).substring(2)}`

    // In a real implementation, insert into database
    console.log(`[DatabaseFailedJobProvider] Logged failed job ${id} to ${this.table} table`)

    return id
  }

  async all(): Promise<FailedJob[]> {
    // In a real implementation, SELECT from database
    console.log(`[DatabaseFailedJobProvider] Fetching all failed jobs from ${this.table}`)
    return []
  }

  async find(id: string): Promise<FailedJob | null> {
    // In a real implementation, SELECT WHERE id = ?
    console.log(`[DatabaseFailedJobProvider] Finding failed job ${id} in ${this.table}`)
    return null
  }

  async forget(id: string): Promise<boolean> {
    // In a real implementation, DELETE WHERE id = ?
    console.log(`[DatabaseFailedJobProvider] Deleting failed job ${id} from ${this.table}`)
    return true
  }

  async flush(hours?: number): Promise<void> {
    // In a real implementation, DELETE with optional WHERE condition
    const condition = hours ? `WHERE failed_at < NOW() - INTERVAL ${hours} HOUR` : ''
    console.log(`[DatabaseFailedJobProvider] DELETE FROM ${this.table} ${condition}`)
  }

  async prune(hours: number): Promise<number> {
    // In a real implementation, DELETE and return affected rows
    console.log(`[DatabaseFailedJobProvider] Pruning failed jobs older than ${hours} hours from ${this.table}`)
    return 0
  }
}
