/**
 * Shared constants for the devtools dashboard.
 */

/** Status colors for D3 dependency graph nodes */
export const STATUS_COLORS: Record<string, string> = {
  completed: '#10b981',
  active: '#6366f1',
  waiting: '#f59e0b',
  pending: '#f59e0b',
  failed: '#ef4444',
}

/** Default color for unknown statuses */
export const DEFAULT_STATUS_COLOR = '#71717a'

/** Monitoring auto-refresh interval in milliseconds */
export const REFRESH_INTERVAL = 3000

/** Maximum number of events to keep in the monitoring event log */
export const MAX_EVENTS = 50
