<script setup lang="ts">
import type { JobDependencyGraph, JobNode } from '../types/job'
import * as d3 from 'd3'
import { onMounted, ref, watch } from 'vue'
import { JobStatus } from '../types/job'

const props = defineProps<{
  data: JobDependencyGraph
  width?: number
  height?: number
}>()

const emit = defineEmits<{
  (e: 'node-click', node: JobNode): void
}>()
const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const tooltip = ref<HTMLDivElement | null>(null)

const graphWidth = props.width || 800
const graphHeight = props.height || 600

// Color map based on job status
const colorMap = {
  [JobStatus.WAITING]: '#f59e0b', // Amber
  [JobStatus.ACTIVE]: '#3b82f6', // Blue
  [JobStatus.COMPLETED]: '#10b981', // Green
  [JobStatus.FAILED]: '#ef4444', // Red
}

// Handle node click to show job details
function handleNodeClick(event: MouseEvent, node: JobNode) {
  // Emit event to parent component
  emit('node-click', node)
}

// Create and render force-directed graph
function renderGraph() {
  if (!svgRef.value || !props.data)
    return

  // Clear existing SVG content
  d3.select(svgRef.value).selectAll('*').remove()

  const svg = d3.select(svgRef.value)
    .attr('width', graphWidth)
    .attr('height', graphHeight)
    .attr('viewBox', `0 0 ${graphWidth} ${graphHeight}`)

  // Create the main group for the graph
  const g = svg.append('g')
    .attr('class', 'graph-container')

  // Define arrow markers for the links
  svg.append('defs').append('marker').attr('id', 'arrowhead').attr('viewBox', '0 -5 10 10').attr('refX', 20).attr('refY', 0).attr('orient', 'auto').attr('markerWidth', 6).attr('markerHeight', 6).append('path').attr('fill', '#64748b').attr('d', 'M0,-5L10,0L0,5')

  // Create simulation
  const simulation = d3.forceSimulation<JobNode>(props.data.nodes)
    .force('link', d3.forceLink<JobNode, d3.SimulationLinkDatum<JobNode>>(props.data.links)
      .id(d => d.id)
      .distance(100))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(graphWidth / 2, graphHeight / 2))
    .force('collision', d3.forceCollide().radius(60))

  // Create links
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(props.data.links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('stroke', '#64748b')
    .attr('stroke-width', 1.5)
    .attr('fill', 'none')
    .attr('marker-end', 'url(#arrowhead)')

  // Create node groups
  const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('.node')
    .data(props.data.nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('cursor', 'pointer')
    .on('click', handleNodeClick)
    .call(d3.drag<SVGGElement, JobNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))
    .on('mouseover', (event, d) => {
      if (!tooltip.value)
        return

      tooltip.value.style.display = 'block'
      tooltip.value.innerHTML = `
        <div class="font-bold">${d.name}</div>
        <div>ID: ${d.id}</div>
        <div>Status: ${d.status}</div>
      `
      tooltip.value.style.left = `${event.pageX + 10}px`
      tooltip.value.style.top = `${event.pageY + 10}px`
    })
    .on('mousemove', (event) => {
      if (!tooltip.value)
        return
      tooltip.value.style.left = `${event.pageX + 10}px`
      tooltip.value.style.top = `${event.pageY + 10}px`
    })
    .on('mouseout', () => {
      if (!tooltip.value)
        return
      tooltip.value.style.display = 'none'
    })

  // Add circles to nodes
  node.append('circle')
    .attr('r', 30)
    .attr('fill', d => colorMap[d.status] || '#64748b')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  // Add text labels to nodes
  node.append('text')
    .attr('dy', 4)
    .attr('text-anchor', 'middle')
    .attr('fill', '#fff')
    .attr('font-weight', 'bold')
    .attr('font-size', '10px')
    .text(d => d.name.substring(0, 10))

  // Add status indicator
  node.append('text')
    .attr('dy', 40)
    .attr('text-anchor', 'middle')
    .attr('fill', '#64748b')
    .attr('font-size', '9px')
    .text(d => d.status)

  // Set up simulation tick function
  simulation.on('tick', () => {
    link.attr('d', (d: any) => {
      const dx = (d.target.x || 0) - (d.source.x || 0)
      const dy = (d.target.y || 0) - (d.source.y || 0)
      const dr = Math.sqrt(dx * dx + dy * dy)
      return `M${d.source.x || 0},${d.source.y || 0}A${dr},${dr} 0 0,1 ${d.target.x || 0},${d.target.y || 0}`
    })

    node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`)
  })

  // Define drag functions
  function dragstarted(event: d3.D3DragEvent<SVGGElement, JobNode, JobNode>) {
    if (!event.active)
      simulation.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  function dragged(event: d3.D3DragEvent<SVGGElement, JobNode, JobNode>) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  function dragended(event: d3.D3DragEvent<SVGGElement, JobNode, JobNode>) {
    if (!event.active)
      simulation.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }

  // Add zoom capability
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform.toString())
    })

  svg.call(zoom)
}

// Watch for data changes and re-render
watch(() => props.data, renderGraph, { deep: true })

onMounted(() => {
  renderGraph()
})
</script>

<template>
  <div ref="containerRef" class="job-dependency-graph">
    <div class="card p-3 mb-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <span class="i-carbon-diagram text-xl text-indigo-600 mr-2" />
          <h3 class="text-lg font-medium text-gray-800">
            Job Dependencies
          </h3>
        </div>

        <!-- Legend -->
        <div class="flex items-center space-x-4 text-sm">
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full bg-amber-500 mr-1.5" />
            <span>Waiting</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full bg-blue-500 mr-1.5" />
            <span>Active</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full bg-emerald-500 mr-1.5" />
            <span>Completed</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full bg-red-500 mr-1.5" />
            <span>Failed</span>
          </div>
        </div>
      </div>
    </div>

    <div class="graph-container card p-0 rounded-xl shadow overflow-hidden relative">
      <div
        ref="tooltip"
        class="absolute hidden bg-white shadow-lg rounded-lg p-2 border border-gray-100 z-10 text-sm"
        style="pointer-events: none;"
      />
      <svg ref="svgRef" class="w-full" />
    </div>

    <div class="text-center text-sm text-gray-500 mt-2">
      Drag nodes to reposition them. Scroll to zoom in/out.
    </div>
  </div>
</template>

<style scoped>
.graph-container {
  min-height: 500px;
}
</style>
