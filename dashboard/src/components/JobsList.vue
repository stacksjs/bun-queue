<script setup lang="ts">
import { format } from 'date-fns'
import { ref } from 'vue'

interface Job {
  id: string
  name: string
  status: string
  data: any
  progress: number
  timestamp: number
  processedOn?: number
  finishedOn?: number
  attemptsMade: number
}

interface Props {
  jobs: Job[]
}

defineProps<Props>()
const expandedJob = ref<string | null>(null)

function formatTime(timestamp: number): string {
  return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss')
}

function formatDuration(start?: number, end?: number): string {
  if (!start || !end)
    return 'N/A'

  const durationMs = end - start
  if (durationMs < 1000) {
    return `${durationMs}ms`
  }
  else if (durationMs < 60000) {
    return `${Math.round(durationMs / 1000)}s`
  }
  else {
    return `${Math.round(durationMs / 60000)}m ${Math.round((durationMs % 60000) / 1000)}s`
  }
}

function toggleDetails(jobId: string) {
  if (expandedJob.value === jobId) {
    expandedJob.value = null
  }
  else {
    expandedJob.value = jobId
  }
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'badge-success'
    case 'failed':
      return 'badge-danger'
    case 'active':
      return 'badge-info'
    case 'waiting':
      return 'badge-warning'
    default:
      return 'bg-gray-200 text-gray-700'
  }
}
</script>

<template>
  <div>
    <div v-if="jobs.length === 0" class="card p-8 text-center text-gray-500">
      No jobs found
    </div>

    <div v-else class="card divide-y">
      <div v-for="job in jobs" :key="job.id" class="p-4">
        <div class="flex justify-between items-center">
          <div>
            <div class="flex items-center">
              <span class="mr-3 text-gray-400 text-sm font-mono">{{ job.id.substring(0, 8) }}</span>
              <h4 class="font-medium">
                {{ job.name }}
              </h4>
              <span class="badge ml-2" :class="[getStatusClass(job.status)]">{{ job.status }}</span>
            </div>
            <p class="text-sm text-gray-500 mt-1">
              Created: {{ formatTime(job.timestamp) }}
            </p>
          </div>

          <div class="flex items-center space-x-4">
            <div v-if="job.progress > 0 && job.progress < 100" class="w-32">
              <div class="bg-gray-200 rounded-full h-2">
                <div
                  class="bg-primary rounded-full h-2"
                  :style="{ width: `${job.progress}%` }"
                />
              </div>
              <div class="text-xs text-gray-500 text-right mt-1">
                {{ job.progress }}%
              </div>
            </div>

            <button
              class="p-2 text-gray-500 hover:text-gray-700"
              @click="toggleDetails(job.id)"
            >
              <div :class="expandedJob === job.id ? 'i-carbon-chevron-up' : 'i-carbon-chevron-down'" />
            </button>
          </div>
        </div>

        <div v-if="expandedJob === job.id" class="mt-4 bg-gray-50 p-4 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 class="text-sm font-medium text-gray-500 mb-1">
                Processing Info
              </h5>
              <div class="space-y-2">
                <div class="grid grid-cols-2 text-sm">
                  <span class="text-gray-500">Attempts:</span>
                  <span>{{ job.attemptsMade }}</span>
                </div>
                <div class="grid grid-cols-2 text-sm">
                  <span class="text-gray-500">Started At:</span>
                  <span>{{ job.processedOn ? formatTime(job.processedOn) : 'N/A' }}</span>
                </div>
                <div class="grid grid-cols-2 text-sm">
                  <span class="text-gray-500">Finished At:</span>
                  <span>{{ job.finishedOn ? formatTime(job.finishedOn) : 'N/A' }}</span>
                </div>
                <div class="grid grid-cols-2 text-sm">
                  <span class="text-gray-500">Duration:</span>
                  <span>{{ formatDuration(job.processedOn, job.finishedOn) }}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 class="text-sm font-medium text-gray-500 mb-1">
                Job Data
              </h5>
              <pre class="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">{{ JSON.stringify(job.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
