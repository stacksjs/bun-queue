/**
 * Shared formatting utilities for the devtools dashboard.
 */

/**
 * Format an ISO timestamp to a locale string.
 * Returns em-dash for null/undefined/empty values.
 * Used by: batches, batch-details, queue-details, job-details, group-details
 */
export function formatTime(ts?: string): string {
  if (!ts) return '\u2014'
  return new Date(ts).toLocaleString()
}

/**
 * Format a duration in milliseconds to a human-readable string.
 * Used by: index (dashboard overview)
 */
export function formatDuration(duration?: number): string {
  return duration ? (duration / 1000).toFixed(1) + 's' : '\u2014'
}

/**
 * Format the current time as HH:MM:SS for event log entries.
 * Used by: monitoring
 */
export function formatEventTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
