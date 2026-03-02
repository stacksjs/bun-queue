export interface DependencyNode {
  id: string
  name?: string
  label?: string
  status: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface DependencyLink {
  source: string | DependencyNode
  target: string | DependencyNode
}

export interface DependencyGraph {
  nodes: DependencyNode[]
  links?: DependencyLink[]
  edges?: DependencyLink[]
}
