/**
 * Browser entry point — assigns all shared functions to globalThis
 * so they're accessible in stx template expressions.
 */
import {
  badgeClass,
  chartOptions,
  createLineDataset,
  DEFAULT_STATUS_COLOR,
  dotColor,
  formatDuration,
  formatEventTime,
  formatTime,
  healthColor,
  MAX_EVENTS,
  progressBarColorClass,
  queueBadgeClass,
  REFRESH_INTERVAL,
  statusLabel,
  STATUS_COLORS,
} from './index'

Object.assign(globalThis, {
  badgeClass,
  chartOptions,
  createLineDataset,
  DEFAULT_STATUS_COLOR,
  dotColor,
  formatDuration,
  formatEventTime,
  formatTime,
  healthColor,
  MAX_EVENTS,
  progressBarColorClass,
  queueBadgeClass,
  REFRESH_INTERVAL,
  statusLabel,
  STATUS_COLORS,
})
