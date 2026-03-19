/**
 * Shared badge/status class utilities for the devtools dashboard.
 * These are bundled and served as globals for stx template expressions.
 */

/**
 * Badge classes for job statuses (active = indigo).
 * Used by: jobs, index, batch-details, batches, group-details, groups
 */
export function badgeClass(status: string): string {
  const map: Record<string, string> = {
    completed: 'bg-emerald-500/15 text-emerald-500',
    finished: 'bg-emerald-500/15 text-emerald-500',
    failed: 'bg-red-500/15 text-red-500',
    processing: 'bg-indigo-500/15 text-indigo-400',
    active: 'bg-indigo-500/15 text-indigo-400',
    waiting: 'bg-amber-500/15 text-amber-500',
    pending: 'bg-amber-500/15 text-amber-500',
    delayed: 'bg-zinc-500/15 text-zinc-500',
  }
  return map[status] || 'bg-zinc-500/15 text-zinc-500'
}

/**
 * Badge classes for queue health statuses (active = emerald).
 * Used by: queues, queue-details
 */
export function queueBadgeClass(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-500',
    paused: 'bg-amber-500/15 text-amber-500',
    stopped: 'bg-red-500/15 text-red-500',
    completed: 'bg-emerald-500/15 text-emerald-500',
    failed: 'bg-red-500/15 text-red-500',
    waiting: 'bg-amber-500/15 text-amber-500',
    pending: 'bg-amber-500/15 text-amber-500',
  }
  return map[status] || 'bg-zinc-500/15 text-zinc-500'
}

/**
 * Progress bar color based on batch/queue status.
 * Used by: batches
 */
export function progressBarColorClass(status: string): string {
  const map: Record<string, string> = {
    completed: 'bg-emerald-500',
    finished: 'bg-emerald-500',
    failed: 'bg-red-500',
    processing: 'bg-indigo-500',
    active: 'bg-indigo-500',
    pending: 'bg-amber-500',
    waiting: 'bg-amber-500',
  }
  return map[status] || 'bg-indigo-500'
}

/**
 * Dot color for monitoring event types.
 * Used by: monitoring
 */
export function dotColor(dot: string): string {
  const map: Record<string, string> = {
    completed: 'bg-emerald-500',
    started: 'bg-indigo-500',
    failed: 'bg-red-500',
    queued: 'bg-amber-500',
  }
  return map[dot] || 'bg-zinc-500'
}

/**
 * Health indicator color based on error rate.
 * Used by: monitoring
 */
export function healthColor(errorRateValue: number): string {
  if (errorRateValue > 5) return 'bg-red-500'
  if (errorRateValue > 1) return 'bg-amber-500'
  return 'bg-emerald-500'
}

/**
 * Queue status display label.
 * Used by: queues
 */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Active',
    paused: 'Paused',
    stopped: 'Stopped',
  }
  return map[status] || status
}
