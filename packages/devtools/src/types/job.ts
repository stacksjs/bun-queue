import type * as d3 from 'd3'

export interface Job {
  id: string
  name: string
  status: string
  queue: string
  created: string
  updated: string
  data?: Record<string, any>
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface JobNode {
  id: string
  name: string
  status: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface JobDependencyLink {
  source: string
  target: string
}

export interface JobDependencyGraph {
  nodes: JobNode[]
  links: JobLink[]
}

export interface JobLink extends d3.SimulationLinkDatum<JobNode> {
  source: string | JobNode
  target: string | JobNode
}
