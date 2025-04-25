import type * as d3 from 'd3'

export interface Job {
  id: string
  name: string
  status: JobStatus
  dependencies?: string[]
}

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface JobNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  status: JobStatus
}

export interface JobLink extends d3.SimulationLinkDatum<JobNode> {
  source: string | JobNode
  target: string | JobNode
}

export interface JobDependencyGraph {
  nodes: JobNode[]
  links: JobLink[]
}
