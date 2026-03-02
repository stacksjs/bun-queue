export interface MetricsData {
  throughput: number[]
  latency: number[]
  errorRate: number[]
  timestamps: string[]
}

export interface MetricsPoint {
  time: string
  value: number
}

export interface ThroughputData {
  throughput: Array<{ label?: string; time?: string; value?: number; count?: number }>
}
