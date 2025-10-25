<script setup lang="ts">
import type { JobDependencyGraph as GraphData, JobNode } from '../types/job'
import { onMounted, ref } from 'vue'
import JobDependencyGraph from '../components/JobDependencyGraph.vue'
import { JobStatus } from '../types/job'

const isLoading = ref(true)
const error = ref<string | null>(null)
const graphData = ref<GraphData>({
  nodes: [],
  links: [],
})

onMounted(async () => {
  try {
    await fetchDependencyData()
    isLoading.value = false
  }
  catch {
    error.value = 'Failed to load job dependencies'
    isLoading.value = false
  }
})

async function fetchDependencyData() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800))

  // Mock data
  graphData.value = {
    nodes: [
      { id: 'job_1', name: 'Data Extract', status: JobStatus.COMPLETED },
      { id: 'job_2', name: 'Data Transform', status: JobStatus.COMPLETED },
      { id: 'job_3', name: 'Data Load', status: JobStatus.ACTIVE },
      { id: 'job_4', name: 'Generate Report', status: JobStatus.WAITING },
      { id: 'job_5', name: 'Send Email', status: JobStatus.WAITING },
      { id: 'job_6', name: 'Archive Data', status: JobStatus.WAITING },
      { id: 'job_7', name: 'Failed Job', status: JobStatus.FAILED },
      { id: 'job_8', name: 'Cleanup', status: JobStatus.WAITING },
    ],
    links: [
      { source: 'job_1', target: 'job_2' },
      { source: 'job_2', target: 'job_3' },
      { source: 'job_3', target: 'job_4' },
      { source: 'job_3', target: 'job_5' },
      { source: 'job_3', target: 'job_6' },
      { source: 'job_2', target: 'job_7' },
      { source: 'job_6', target: 'job_8' },
      { source: 'job_7', target: 'job_8' },
    ],
  }
}

function handleNodeClick(_node: JobNode) {
  // In a real app, you would show job details or navigate to job page
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">
        Job Dependencies
      </h2>
    </div>

    <div v-if="isLoading" class="card p-8 text-center">
      <div class="flex justify-center items-center space-x-2">
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600">
        Loading dependency graph...
      </p>
    </div>

    <div v-else-if="error" class="card bg-danger/10 text-danger p-8 text-center">
      <p>{{ error }}</p>
      <button class="btn btn-primary mt-4" @click="fetchDependencyData">
        Retry
      </button>
    </div>

    <div v-else>
      <JobDependencyGraph
        :data="graphData"
        :width="800"
        :height="600"
        @node-click="handleNodeClick"
      />
    </div>
  </div>
</template>
