import type { RedisClient } from 'bun'
import { createLogger } from './logger'
import { generateId } from './utils'

export interface LeaderElectionOptions {
  /**
   * Key prefix for leader election
   */
  keyPrefix?: string

  /**
   * Duration (in ms) for which leadership is valid (default: 10000)
   */
  heartbeatInterval?: number

  /**
   * Duration (in ms) for how long a node can be unreachable before leadership is transferred
   */
  leaderTimeout?: number

  /**
   * Callback when instance becomes the leader
   */
  onBecomeLeader?: () => void

  /**
   * Callback when instance loses leadership
   */
  onLeadershipLost?: () => void

  /**
   * Callback when leader changes
   */
  onLeaderChanged?: (leaderId: string) => void

  /**
   * Instance ID (defaults to auto-generated)
   */
  instanceId?: string
}

/**
 * Implements leader election for distributed queue instances
 * using Redis for coordination
 */
export class LeaderElection {
  private readonly redisClient: RedisClient
  private readonly keyPrefix: string
  private readonly instanceId: string
  private readonly logger = createLogger('leader')
  private readonly heartbeatInterval: number
  private readonly leaderTimeout: number
  private readonly options: LeaderElectionOptions
  private heartbeatTimer: NodeJS.Timeout | null = null
  private watchdogTimer: NodeJS.Timeout | null = null
  private isLeader = false
  private currentLeaderId: string | null = null

  constructor(redisClient: RedisClient, options: LeaderElectionOptions = {}) {
    this.redisClient = redisClient
    this.keyPrefix = options.keyPrefix || 'bun-queue:leader'
    this.instanceId = options.instanceId || generateId()
    this.heartbeatInterval = options.heartbeatInterval || 10000 // 10 seconds default
    this.leaderTimeout = options.leaderTimeout || this.heartbeatInterval * 3 // 3x heartbeat by default
    this.options = options

    this.logger.debug(`Leader election initialized for instance ${this.instanceId}`)
  }

  /**
   * Start the leader election process
   */
  async start(): Promise<void> {
    this.logger.info(`Starting leader election for instance ${this.instanceId}`)

    // Start the watchdog to monitor leader
    this.startWatchdog()

    // Try to elect ourselves as the leader
    await this.electLeader()
  }

  /**
   * Stop participating in leader election
   */
  async stop(): Promise<void> {
    this.logger.info(`Stopping leader election for instance ${this.instanceId}`)

    // Clear timers
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer)
      this.watchdogTimer = null
    }

    // If we're the leader, gracefully step down
    if (this.isLeader) {
      await this.stepDown()
    }
  }

  /**
   * Check if this instance is the current leader
   */
  isCurrentLeader(): boolean {
    return this.isLeader
  }

  /**
   * Get the ID of the current leader
   */
  async getCurrentLeader(): Promise<string | null> {
    try {
      const leaderKey = `${this.keyPrefix}:current`
      const leaderInfo = await this.redisClient.get(leaderKey)

      if (!leaderInfo) {
        return null
      }

      // Parse the leader info (format: "instanceId:timestamp")
      const [leaderId, timestampStr] = leaderInfo.split(':')
      const timestamp = Number.parseInt(timestampStr, 10)

      // Check if the leader has timed out
      if (Date.now() - timestamp > this.leaderTimeout) {
        this.logger.debug(`Leader ${leaderId} has timed out, no current leader`)
        return null
      }

      return leaderId
    }
    catch (err) {
      this.logger.error(`Error getting current leader: ${(err as Error).message}`)
      return null
    }
  }

  /**
   * Try to elect ourselves as the leader
   */
  private async electLeader(): Promise<void> {
    try {
      const leaderKey = `${this.keyPrefix}:current`
      const now = Date.now()
      const newLeaderInfo = `${this.instanceId}:${now}`

      // Check if there's an existing leader
      const currentLeader = await this.getCurrentLeader()

      if (currentLeader) {
        // There's already a valid leader
        if (currentLeader !== this.instanceId && this.currentLeaderId !== currentLeader) {
          this.logger.info(`Instance ${currentLeader} is the current leader`)
          this.currentLeaderId = currentLeader

          if (this.options.onLeaderChanged) {
            this.options.onLeaderChanged(currentLeader)
          }
        }

        // If we're already the leader, just send a heartbeat
        if (currentLeader === this.instanceId && !this.isLeader) {
          this.becomeLeader()
        }
        return
      }

      // Try to become the leader using SET NX
      const result = await this.redisClient.send('SET', [
        leaderKey,
        newLeaderInfo,
        'NX',
        'PX',
        this.leaderTimeout.toString(),
      ])

      if (result === 'OK') {
        // We became the leader
        this.becomeLeader()
      }
      else {
        // Someone else beat us to it, check who it is
        await this.checkLeadership()
      }
    }
    catch (err) {
      this.logger.error(`Error in leader election: ${(err as Error).message}`)
    }
  }

  /**
   * Become the leader and start sending heartbeats
   */
  private becomeLeader(): void {
    if (this.isLeader)
      return

    this.isLeader = true
    this.currentLeaderId = this.instanceId
    this.logger.info(`Instance ${this.instanceId} became the leader`)

    // Call the handler if provided
    if (this.options.onBecomeLeader) {
      this.options.onBecomeLeader()
    }

    // Start sending heartbeats
    this.startHeartbeat()
  }

  /**
   * Start sending heartbeats to maintain leadership
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    this.heartbeatTimer = setInterval(async () => {
      try {
        if (!this.isLeader) {
          clearInterval(this.heartbeatTimer as NodeJS.Timeout)
          this.heartbeatTimer = null
          return
        }

        const leaderKey = `${this.keyPrefix}:current`
        const now = Date.now()
        const leaderInfo = `${this.instanceId}:${now}`

        // Update the leader key with fresh timestamp
        const result = await this.redisClient.send('SET', [
          leaderKey,
          leaderInfo,
          'PX',
          this.leaderTimeout.toString(),
        ])

        if (result !== 'OK') {
          this.logger.warn(`Failed to send heartbeat, may have lost leadership`)
          // We'll check leadership in the next watchdog cycle
        }
        else {
          this.logger.debug(`Sent leader heartbeat`)
        }
      }
      catch (err) {
        this.logger.error(`Error sending heartbeat: ${(err as Error).message}`)
      }
    }, Math.max(1000, this.heartbeatInterval / 3)) // At least once per second but no more than 1/3 of timeout
  }

  /**
   * Start the watchdog to monitor leadership and trigger elections
   */
  private startWatchdog(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer)
    }

    this.watchdogTimer = setInterval(async () => {
      try {
        await this.checkLeadership()
      }
      catch (err) {
        this.logger.error(`Error in watchdog: ${(err as Error).message}`)
      }
    }, this.heartbeatInterval)
  }

  /**
   * Check leadership status and trigger election if needed
   */
  private async checkLeadership(): Promise<void> {
    const currentLeader = await this.getCurrentLeader()

    // If we think we're the leader but we're not
    if (this.isLeader && currentLeader !== this.instanceId) {
      this.loseLeadership()
    }

    // If there's no leader, try to become one
    if (!currentLeader) {
      await this.electLeader()
      return
    }

    // If leader changed, trigger the callback
    if (currentLeader !== this.currentLeaderId) {
      this.currentLeaderId = currentLeader
      this.logger.info(`Leader changed to ${currentLeader}`)

      if (this.options.onLeaderChanged) {
        this.options.onLeaderChanged(currentLeader)
      }
    }
  }

  /**
   * Handle losing leadership
   */
  private loseLeadership(): void {
    if (!this.isLeader)
      return

    this.isLeader = false
    this.logger.info(`Instance ${this.instanceId} lost leadership`)

    // Stop heartbeats
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    // Call the handler if provided
    if (this.options.onLeadershipLost) {
      this.options.onLeadershipLost()
    }
  }

  /**
   * Voluntarily step down as leader
   */
  private async stepDown(): Promise<void> {
    if (!this.isLeader)
      return

    try {
      const leaderKey = `${this.keyPrefix}:current`

      // Only delete if we're still the leader
      const currentValue = await this.redisClient.get(leaderKey)
      if (currentValue && currentValue.startsWith(this.instanceId)) {
        await this.redisClient.del(leaderKey)
      }

      this.loseLeadership()
      this.logger.info(`Instance ${this.instanceId} stepped down as leader`)
    }
    catch (err) {
      this.logger.error(`Error stepping down as leader: ${(err as Error).message}`)
    }
  }
}
