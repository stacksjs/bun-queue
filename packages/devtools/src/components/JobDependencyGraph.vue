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
  (e: 'nodeClick', node: JobNode): void
}>()

const svgRef = ref<SVGElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const tooltip = ref<HTMLElement | null>(null)

// Color map based on job status
const colorMap = {
  [JobStatus.WAITING]: '#f59e0b', // Amber
  [JobStatus.ACTIVE]: '#3b82f6', // Blue
  [JobStatus.COMPLETED]: '#10b981', // Green
  [JobStatus.FAILED]: '#ef4444', // Red
}

// Create and render force-directed graph
function renderGraph() {
  if (!svgRef.value || !props.data || props.data.nodes.length === 0)
    return

  // Clear existing SVG content
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const width = props.width || 800
  const height = props.height || 600

  svg
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)

  // Create a container group for the graph
  const g = svg.append('g')

  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom as any)
    .on('dblclick.zoom', null) // Disable double-click zoom

  // Add arrow marker for the links
  svg.append('defs')
    .append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 20)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#888')

  // Prepare data structures
  const nodes = props.data.nodes.map(d => ({ ...d }))
  const links = props.data.links.map(d => ({ ...d }))

  // Create the simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links)
      .id((d: any) => d.id)
      .distance(100))
    .force('charge', d3.forceManyBody().strength(-500))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('x', d3.forceX(width / 2).strength(0.1))
    .force('y', d3.forceY(height / 2).strength(0.1))
    .force('collision', d3.forceCollide().radius(50))

  // Create links
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll('path')
    .data(links)
    .join('path')
    .attr('stroke', '#888')
    .attr('stroke-width', 1.5)
    .attr('fill', 'none')
    .attr('marker-end', 'url(#arrow)')

  // Create nodes
  const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('cursor', 'pointer')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended) as any)
    .on('click', (event, d) => {
      event.stopPropagation()
      emit('nodeClick', d)
    })

  // Add node circles
  node.append('circle')
    .attr('r', 30)
    .attr('fill', d => colorMap[d.status as JobStatus] || '#888')
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .on('mouseover', (event, d) => {
      if (tooltip.value) {
        tooltip.value.style.opacity = '1'
        tooltip.value.style.visibility = 'visible'
        tooltip.value.innerHTML = `
          <div class="font-bold">${d.name}</div>
          <div>ID: ${d.id}</div>
          <div>Status: ${d.status}</div>
        `
        tooltip.value.style.left = `${event.pageX + 10}px`
        tooltip.value.style.top = `${event.pageY + 10}px`
      }
    })
    .on('mousemove', (event) => {
      if (tooltip.value) {
        tooltip.value.style.left = `${event.pageX + 10}px`
        tooltip.value.style.top = `${event.pageY + 10}px`
      }
    })
    .on('mouseout', () => {
      if (tooltip.value) {
        tooltip.value.style.opacity = '0'
        tooltip.value.style.visibility = 'hidden'
      }
    })

  // Add node labels
  node.append('text')
    .attr('dy', 2)
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .attr('font-weight', 'bold')
    .attr('pointer-events', 'none')
    .attr('font-size', '11px')
    .text(d => d.name.length > 10 ? `${d.name.slice(0, 10)}...` : d.name)

  // Add status text below the node
  node.append('text')
    .attr('dy', 45)
    .attr('text-anchor', 'middle')
    .attr('fill', '#666')
    .attr('pointer-events', 'none')
    .attr('font-size', '9px')
    .text(d => d.status)

  // Update positions on each tick
  simulation.on('tick', () => {
    link.attr('d', linkArc)
    node.attr('transform', d => `translate(${d.x},${d.y})`)
  })

  // Helper function to create curved links
  function linkArc(d: any) {
    const dx = d.target.x - d.source.x
    const dy = d.target.y - d.source.y
    const dr = Math.sqrt(dx * dx + dy * dy) * 1.5
    return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`
  }

  // Drag functions
  function dragstarted(event: any) {
    if (!event.active)
      simulation.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  function dragged(event: any) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  function dragended(event: any) {
    if (!event.active)
      simulation.alphaTarget(0)
    // Keep the node fixed where it was dragged
    // event.subject.fx = null
    // event.subject.fy = null
  }

  // Run the simulation for a bit to settle the nodes
  simulation.alpha(1).restart()

  // Add a background click handler to reset transform
  svg.on('dblclick', () => {
    svg.transition()
      .duration(750)
      .call(zoom.transform as any, d3.zoomIdentity)
  })
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
        class="absolute opacity-0 invisible bg-white shadow-lg rounded-lg p-2 border border-gray-100 z-10 text-sm transition-opacity duration-200"
        style="pointer-events: none;"
      />
      <svg ref="svgRef" class="w-full h-[600px]" />
    </div>

    <div class="text-center text-sm text-gray-500 mt-2">
      Drag nodes to reposition them. Double-click to reset the view. Scroll to zoom in/out.
    </div>
  </div>
</template>

<style scoped>
.graph-container {
  min-height: 500px;
  background-color: white;
  border-radius: 0.75rem;
  overflow: hidden;
  position: relative;
}

.job-dependency-graph svg {
  display: block;
  width: 100%;
  height: 600px;
  background-color: #fafafa;
}

/* Circle nodes */
:deep(circle) {
  stroke: white;
  stroke-width: 2px;
  transition: all 0.3s;
}

:deep(circle:hover) {
  filter: brightness(110%);
  stroke-width: 3px;
}

/* Node text */
:deep(text) {
  font-family: system-ui, sans-serif;
  font-size: 11px;
  pointer-events: none;
}

/* Links between nodes */
:deep(path.link) {
  fill: none;
  stroke: #888;
  stroke-width: 1.5px;
  opacity: 0.7;
}

/* Tooltip */
.tooltip {
  position: absolute;
  padding: 8px 12px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  font-size: 12px;
  z-index: 100;
  pointer-events: none;
  transition: opacity 0.2s, visibility 0.2s;
}
</style>
