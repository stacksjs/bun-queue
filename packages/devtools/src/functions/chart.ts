/**
 * Shared Chart.js configuration for the devtools dashboard dark theme.
 */

/**
 * Default chart options for the dark-themed dashboard.
 * Used by: metrics, index, queue-details
 */
export function chartOptions(overrides?: Record<string, unknown>): Record<string, unknown> {
  const defaults: Record<string, unknown> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: 'rgba(39,39,42,0.5)' },
        ticks: { color: '#71717a', font: { size: 10 }, maxRotation: 0, maxTicksLimit: 10 },
      },
      y: {
        grid: { color: 'rgba(39,39,42,0.5)' },
        ticks: { color: '#71717a', font: { size: 10 } },
        beginAtZero: true,
      },
    },
    interaction: { intersect: false, mode: 'index' },
  }

  if (!overrides) return defaults

  return { ...defaults, ...overrides }
}

interface LineDataset {
  label: string
  data: number[]
  borderColor: string
  backgroundColor: string
  fill: boolean
  tension: number
  pointRadius: number
  pointHitRadius: number
  borderWidth: number
}

/**
 * Create a styled line dataset for Chart.js.
 * Used by: metrics
 */
export function createLineDataset(label: string, data: number[], color: string): LineDataset {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: color.replace(')', ', 0.1)').replace('rgb', 'rgba'),
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    pointHitRadius: 10,
    borderWidth: 2,
  }
}
