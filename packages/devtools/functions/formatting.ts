/**
 * Formatting utilities for timestamps, durations, and status labels.
 */

/** Format timestamp to locale string */
export function formatTime(ts: string | number | null | undefined): string {
  if (!ts) return '\u2014'
  return new Date(ts).toLocaleString()
}

/** Format duration in ms to seconds string */
export function formatDuration(duration: number | null | undefined): string {
  return duration ? `${(duration / 1000).toFixed(1)}s` : '\u2014'
}

/** Format current time for event log */
export function formatEventTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/** Queue status to display label */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Active',
    paused: 'Paused',
    stopped: 'Stopped',
  }
  return map[status] || status
}
