/**
 * Chart.js dark theme defaults and dataset factories.
 */

/** Chart.js dark theme options with optional overrides */
export function chartOptions(overrides?: Record<string, unknown>): Record<string, unknown> {
  const defaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
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
    interaction: {
      intersect: false,
      mode: 'index',
    },
  }
  return overrides ? Object.assign({}, defaults, overrides) : defaults
}

/** Create a Chart.js line dataset with sensible defaults */
export function createLineDataset(label: string, data: number[], color: string) {
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
