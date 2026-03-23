#!/usr/bin/env bun
import { Queue } from '@stacksjs/bun-queue'
import { serveDashboard } from './index'

function parseArgs(): { port: number, broadcastPort: number, redisHost: string, redisPort: number, redisPassword?: string, redisDb: number, prefix: string, queues: string[] } {
  const args = process.argv.slice(2)
  const opts = {
    port: 4400,
    broadcastPort: 6001,
    redisHost: '127.0.0.1',
    redisPort: 6379,
    redisPassword: undefined as string | undefined,
    redisDb: 0,
    prefix: 'queue',
    queues: [] as string[],
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    const next = args[i + 1]

    if (arg === '--help' || arg === '-h') {
      // eslint-disable-next-line no-console
      console.log(`
bun-queue dashboard

Usage:
  bunx @stacksjs/bun-queue-dashboard [options]

Options:
  --port <number>           Dashboard port (default: 4400)
  --broadcast-port <number> WebSocket port (default: 6001)
  --redis <host:port>       Redis connection (default: 127.0.0.1:6379)
  --redis-password <pass>   Redis password
  --redis-db <number>       Redis database (default: 0)
  --prefix <string>         Queue key prefix (default: queue)
  --queues <names>          Comma-separated queue names (auto-discovers if omitted)
  -h, --help                Show this help

Examples:
  bunx @stacksjs/bun-queue-dashboard
  bunx @stacksjs/bun-queue-dashboard --port 8080 --queues emails,payments
  bunx @stacksjs/bun-queue-dashboard --redis 10.0.0.5:6379 --redis-password secret
`)
      process.exit(0)
    }

    if ((arg === '--port' || arg === '-p') && next) { opts.port = Number.parseInt(next); i++ }
    else if (arg === '--broadcast-port' && next) { opts.broadcastPort = Number.parseInt(next); i++ }
    else if (arg === '--redis' && next) {
      const parts = next.split(':')
      opts.redisHost = parts[0]
      if (parts[1]) opts.redisPort = Number.parseInt(parts[1])
      i++
    }
    else if (arg === '--redis-password' && next) { opts.redisPassword = next; i++ }
    else if (arg === '--redis-db' && next) { opts.redisDb = Number.parseInt(next); i++ }
    else if (arg === '--prefix' && next) { opts.prefix = next; i++ }
    else if (arg === '--queues' && next) { opts.queues = next.split(',').map(s => s.trim()).filter(Boolean); i++ }
  }

  return opts
}

async function discoverQueues(host: string, port: number, password: string | undefined, db: number, prefix: string): Promise<string[]> {
  const { RedisClient } = await import('bun') as any
  const url = password
    ? `redis://:${password}@${host}:${port}/${db}`
    : `redis://${host}:${port}/${db}`
  const client = new RedisClient(url)

  try {
    const names = new Set<string>()

    // Scan for queue keys: prefix:queueName:waiting, :active, :completed, :failed, :id, :meta
    const suffixes = ['waiting', 'active', 'completed', 'failed', 'id', 'meta', 'delayed']
    for (const suffix of suffixes) {
      const keys = await client.send('KEYS', [`${prefix}:*:${suffix}`]) as string[]
      for (const key of keys) {
        const parts = key.split(':')
        if (parts.length >= 3 && parts[0] === prefix) {
          names.add(parts[1])
        }
      }
    }

    client.close()
    return [...names].sort()
  }
  catch (err) {
    try { client.close() } catch {}
    throw err
  }
}

async function main(): Promise<void> {
  const opts = parseArgs()

  // eslint-disable-next-line no-console
  console.log('bun-queue dashboard')
  // eslint-disable-next-line no-console
  console.log(`Connecting to Redis at ${opts.redisHost}:${opts.redisPort}...`)

  let queueNames = opts.queues

  // Auto-discover queues from Redis if none specified
  if (queueNames.length === 0) {
    try {
      queueNames = await discoverQueues(opts.redisHost, opts.redisPort, opts.redisPassword, opts.redisDb, opts.prefix)
      if (queueNames.length === 0) {
        // eslint-disable-next-line no-console
        console.log('No queues found in Redis. Starting with empty dashboard.')
      }
      else {
        // eslint-disable-next-line no-console
        console.log(`Discovered ${queueNames.length} queue(s): ${queueNames.join(', ')}`)
      }
    }
    catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to discover queues: ${err instanceof Error ? err.message : err}`)
      // eslint-disable-next-line no-console
      console.log('Starting with empty dashboard. Add queues with --queues flag.')
    }
  }

  const redisUrl = opts.redisPassword
    ? `redis://:${opts.redisPassword}@${opts.redisHost}:${opts.redisPort}/${opts.redisDb}`
    : `redis://${opts.redisHost}:${opts.redisPort}/${opts.redisDb}`

  const queues = queueNames.map(name => new Queue(name, {
    redis: { url: redisUrl },
    prefix: opts.prefix,
    logLevel: 'silent',
  }))

  await serveDashboard({
    port: opts.port,
    broadcastPort: opts.broadcastPort,
    queues,
  })
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal:', err)
  process.exit(1)
})
