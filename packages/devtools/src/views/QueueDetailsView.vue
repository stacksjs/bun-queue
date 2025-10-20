<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQueueStore } from '../store/queueStore'

const route = useRoute()
const router = useRouter()
const queueStore = useQueueStore()
const isLoading = ref(true)
const error = ref<string | null>(null)
const queueId = route.params.id as string
const showClearConfirm = ref(false)
const processingHistory = ref<number[]>([])

// Find queue by ID
const queue = computed(() => {
  return queueStore.queues.find(q => q.id === queueId)
})

// Queue metrics
const queueMetrics = computed(() => {
  if (!queue.value)
    return null

  return {
    throughput: Math.floor(Math.random() * 15) + 5, // jobs per minute
    avgWaitTime: Math.floor(Math.random() * 500) + 100, // ms
    avgRunTime: Math.floor(Math.random() * 800) + 200, // ms
    failureRate: Number.parseFloat((Math.random() * 2).toFixed(1)), // percentage
  }
})

// Calculation for completion percentage
const completionRate = computed(() => {
  if (!queue.value)
    return 0
  const total = queue.value.jobCount
  if (total === 0)
    return 100
  return Math.round((queue.value.completedJobs / total) * 100)
})

// Mock job data for the selected queue
const queueJobs = ref<any[]>([])
const notification = ref<{ message: string, type: string } | null>(null)

// Generate mock processing history data
function generateProcessingHistory() {
  processingHistory.value = Array.from({ length: 24 }, () =>
    Math.floor(Math.random() * 15) + 1)
}

onMounted(async () => {
  try {
    // Fetch queues if not already loaded
    if (!queueStore.hasQueues) {
      await queueStore.fetchQueues()
    }

    // Fetch jobs for this queue (mock data)
    await queueStore.fetchJobs()
    // Filter jobs that belong to this queue
    queueJobs.value = queueStore.jobs.filter(job => job.queue.toLowerCase().replace(/\s+/g, '_') === queueId)

    // Generate processing history
    generateProcessingHistory()

    isLoading.value = false

    // If queue doesn't exist, redirect to queues list
    if (!queue.value && !isLoading.value) {
      router.push('/queues')
    }
  }
  catch (err) {
    error.value = 'Failed to load queue details'
    isLoading.value = false
    console.error('Error loading queue details:', err)
  }
})

async function refreshData() {
  isLoading.value = true
  error.value = null

  try {
    await Promise.all([
      queueStore.fetchQueues(true),
      queueStore.fetchJobs(true),
    ])

    // Filter jobs that belong to this queue
    queueJobs.value = queueStore.jobs.filter(job => job.queue.toLowerCase().replace(/\s+/g, '_') === queueId)

    // Update processing history
    generateProcessingHistory()

    isLoading.value = false
  }
  catch (err) {
    error.value = 'Failed to refresh queue details'
    isLoading.value = false
    console.error('Error refreshing queue details:', err)
  }
}

// Mock queue action handlers
function pauseQueue() {
  // Implementation would connect to the backend API
  notification.value = { message: 'Queue paused successfully', type: 'success' }
  setTimeout(() => notification.value = null, 3000)
}

function resumeQueue() {
  // Implementation would connect to the backend API
  notification.value = { message: 'Queue resumed successfully', type: 'success' }
  setTimeout(() => notification.value = null, 3000)
}

function confirmClearQueue() {
  showClearConfirm.value = true
}

function clearQueue() {
  // Implementation would connect to the backend API
  notification.value = { message: 'Queue cleared successfully', type: 'success' }
  showClearConfirm.value = false
  setTimeout(() => notification.value = null, 3000)
}

function retryFailedJobs() {
  // Implementation would connect to the backend API
  notification.value = { message: 'Failed jobs have been retried', type: 'success' }
  setTimeout(() => notification.value = null, 3000)
}
</script>

<template>
  <div>
    <!-- Notification component -->
    <div
      v-if="notification" class="fixed top-4 right-4 z-50 max-w-md" :class="{
        'bg-green-50 border-green-500 text-green-700': notification.type === 'success',
        'bg-red-50 border-red-500 text-red-700': notification.type === 'error',
        'bg-amber-50 border-amber-500 text-amber-700': notification.type === 'warning',
      }"
    >
      <div class="p-4 rounded-lg shadow-lg border-l-4 flex items-start">
        <span v-if="notification.type === 'success'" class="i-carbon-checkmark-filled text-green-600 mr-3 text-xl" />
        <span v-else-if="notification.type === 'error'" class="i-carbon-warning-filled text-red-600 mr-3 text-xl" />
        <span v-else class="i-carbon-information-filled text-amber-600 mr-3 text-xl" />
        <p>{{ notification.message }}</p>
      </div>
    </div>

    <div class="flex items-center mb-4">
      <router-link to="/queues" class="mr-3 text-gray-500 hover:text-indigo-600">
        <span class="i-carbon-arrow-left text-xl" />
      </router-link>
      <h2 class="text-2xl font-bold">
        Queue Details
      </h2>
      <button class="ml-auto btn btn-primary flex items-center" :disabled="isLoading" @click="refreshData">
        <span v-if="isLoading" class="loader mr-2" />
        <span v-else class="i-carbon-refresh mr-2" />
        {{ isLoading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="isLoading && !queue" class="card p-8 text-center">
      <div class="flex justify-center items-center space-x-3">
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600">
        Loading queue details...
      </p>
    </div>

    <div v-else-if="error" class="card bg-red-50 border border-red-200 text-red-600 p-8 text-center rounded-xl shadow">
      <span class="i-carbon-warning-alt text-4xl text-red-500 mb-3" />
      <p class="font-medium">
        {{ error }}
      </p>
      <button class="btn btn-primary mt-5 px-6 py-2.5" @click="refreshData">
        <span class="i-carbon-restart mr-2" />
        Retry
      </button>
    </div>

    <div v-else-if="!queue" class="card bg-amber-50 border border-amber-200 text-amber-600 p-8 text-center rounded-xl shadow">
      <span class="i-carbon-warning-alt text-4xl text-amber-500 mb-3" />
      <p class="font-medium">
        Queue not found
      </p>
      <router-link to="/queues" class="btn btn-primary mt-5 px-6 py-2.5">
        <span class="i-carbon-list mr-2" />
        Back to Queues
      </router-link>
    </div>

    <template v-else>
      <!-- Queue Info Header -->
      <div class="card p-6 mb-6 rounded-xl shadow">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-semibold">
              {{ queue.name }}
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              ID: {{ queue.id }}
            </p>
          </div>
          <div
            class="badge" :class="{
              'badge-success': queue.status === 'active',
              'badge-warning': queue.status === 'paused',
              'badge-danger': queue.status === 'stopped',
            }"
          >
            {{ queue.status }}
          </div>
        </div>

        <!-- Progress bar -->
        <div class="mt-4">
          <div class="flex justify-between text-sm mb-1">
            <span>Completion Rate</span>
            <span>{{ completionRate }}%</span>
          </div>
          <div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full" :style="{ width: `${completionRate}%` }" />
          </div>
        </div>

        <!-- Queue Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div class="p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-500">
              Total Jobs
            </div>
            <div class="text-2xl font-semibold">
              {{ queue.jobCount }}
            </div>
          </div>
          <div class="p-4 bg-amber-50 rounded-lg">
            <div class="text-sm text-amber-600">
              Pending Jobs
            </div>
            <div class="text-2xl font-semibold text-amber-600">
              {{ queue.pendingJobs }}
            </div>
          </div>
          <div class="p-4 bg-blue-50 rounded-lg">
            <div class="text-sm text-blue-600">
              Active Jobs
            </div>
            <div class="text-2xl font-semibold text-blue-600">
              {{ queue.activeJobs }}
            </div>
          </div>
          <div class="p-4 bg-emerald-50 rounded-lg">
            <div class="text-sm text-emerald-600">
              Completed Jobs
            </div>
            <div class="text-2xl font-semibold text-emerald-600">
              {{ queue.completedJobs }}
            </div>
          </div>
        </div>

        <!-- Queue Actions -->
        <div class="flex flex-wrap gap-3 mt-6">
          <button
            v-if="queue.status === 'active'"
            class="btn btn-outline text-gray-700 flex items-center gap-2"
            @click="pauseQueue"
          >
            <span class="i-carbon-pause" />
            Pause Queue
          </button>
          <button
            v-else
            class="btn btn-outline text-gray-700 flex items-center gap-2"
            @click="resumeQueue"
          >
            <span class="i-carbon-play" />
            Resume Queue
          </button>
          <button class="btn btn-outline text-red-600 flex items-center gap-2" @click="confirmClearQueue">
            <span class="i-carbon-delete" />
            Clear Queue
          </button>
          <button class="btn btn-outline text-amber-600 flex items-center gap-2" @click="retryFailedJobs">
            <span class="i-carbon-restart" />
            Retry Failed Jobs
          </button>

          <!-- Confirmation dialog -->
          <div v-if="showClearConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 class="text-lg font-bold mb-4">
                Clear Queue
              </h3>
              <p class="mb-6">
                Are you sure you want to clear all jobs from this queue? This action cannot be undone.
              </p>
              <div class="flex justify-end space-x-3">
                <button class="btn btn-outline" @click="showClearConfirm = false">
                  Cancel
                </button>
                <button class="btn btn-danger" @click="clearQueue">
                  Clear Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Queue Metrics -->
      <div v-if="queueMetrics" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <!-- Throughput and Metrics card -->
        <div class="card p-6 rounded-xl shadow">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <span class="i-carbon-chart-line text-xl text-indigo-600 mr-2" />
            Queue Metrics
          </h3>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-indigo-50 rounded-lg">
              <div class="text-xs text-indigo-600">
                Throughput
              </div>
              <div class="flex items-end">
                <span class="text-xl font-semibold text-indigo-600">{{ queueMetrics.throughput }}</span>
                <span class="text-xs text-indigo-500 ml-1 mb-0.5">jobs/min</span>
              </div>
            </div>

            <div class="p-3 bg-purple-50 rounded-lg">
              <div class="text-xs text-purple-600">
                Avg Wait Time
              </div>
              <div class="flex items-end">
                <span class="text-xl font-semibold text-purple-600">{{ queueMetrics.avgWaitTime }}</span>
                <span class="text-xs text-purple-500 ml-1 mb-0.5">ms</span>
              </div>
            </div>

            <div class="p-3 bg-blue-50 rounded-lg">
              <div class="text-xs text-blue-600">
                Avg Run Time
              </div>
              <div class="flex items-end">
                <span class="text-xl font-semibold text-blue-600">{{ queueMetrics.avgRunTime }}</span>
                <span class="text-xs text-blue-500 ml-1 mb-0.5">ms</span>
              </div>
            </div>

            <div class="p-3 bg-red-50 rounded-lg">
              <div class="text-xs text-red-600">
                Failure Rate
              </div>
              <div class="flex items-end">
                <span class="text-xl font-semibold text-red-600">{{ queueMetrics.failureRate }}</span>
                <span class="text-xs text-red-500 ml-1 mb-0.5">%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Processing History -->
        <div class="card p-6 rounded-xl shadow">
          <h3 class="text-lg font-semibold mb-4 flex items-center">
            <span class="i-carbon-chart-bar text-xl text-indigo-600 mr-2" />
            Processing History (24h)
          </h3>

          <div class="flex h-36 items-end justify-between px-2">
            <div
              v-for="(value, index) in processingHistory"
              :key="index"
              class="w-2 bg-indigo-500 rounded-t-sm"
              :style="{ height: `${Math.min(100, value / Math.max(...processingHistory) * 100)}%` }"
            />
          </div>

          <div class="flex justify-between mt-2 px-2 text-xs text-gray-500">
            <span>24h ago</span>
            <span>12h ago</span>
            <span>now</span>
          </div>
        </div>
      </div>

      <!-- Queue Jobs -->
      <div class="card p-6 rounded-xl shadow">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <span class="i-carbon-document text-xl text-indigo-600 mr-2" />
          Recent Jobs in Queue
        </h3>

        <div v-if="isLoading" class="py-8 text-center">
          <div class="loader mx-auto mb-3" />
          <p class="text-gray-500">
            Loading jobs...
          </p>
        </div>

        <div v-else-if="queueJobs.length === 0" class="py-8 text-center text-gray-500">
          <span class="i-carbon-document-blank text-4xl block mx-auto mb-2 opacity-50" />
          <p>No jobs found in this queue</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="text-left border-b border-gray-200">
                <th class="pb-3 px-2">
                  ID
                </th>
                <th class="pb-3 px-2">
                  Name
                </th>
                <th class="pb-3 px-2">
                  Status
                </th>
                <th class="pb-3 px-2">
                  Created
                </th>
                <th class="pb-3 px-2">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in queueJobs" :key="job.id" class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-2">
                  <span class="text-sm font-mono">{{ job.id }}</span>
                </td>
                <td class="py-3 px-2">
                  {{ job.name }}
                </td>
                <td class="py-3 px-2">
                  <span
                    class="inline-block px-2 py-1 text-xs rounded-full"
                    :class="{
                      'bg-amber-100 text-amber-700': job.status === 'waiting',
                      'bg-blue-100 text-blue-700': job.status === 'active',
                      'bg-emerald-100 text-emerald-700': job.status === 'completed',
                      'bg-red-100 text-red-700': job.status === 'failed',
                    }"
                  >
                    {{ job.status }}
                  </span>
                </td>
                <td class="py-3 px-2 text-sm text-gray-600">
                  {{ job.created }}
                </td>
                <td class="py-3 px-2">
                  <router-link :to="`/jobs/${job.id}`" class="btn btn-small btn-outline">
                    Details
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 flex justify-between">
          <router-link to="/jobs" class="btn btn-outline flex items-center gap-2">
            <span class="i-carbon-list" />
            View All Jobs
          </router-link>

          <div class="flex gap-2">
            <button class="btn btn-small btn-outline">
              Previous
            </button>
            <button class="btn btn-small btn-outline">
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Worker information -->
      <div class="card p-6 mt-6 rounded-xl shadow">
        <h3 class="text-lg font-semibold mb-4 flex items-center">
          <span class="i-carbon-settings text-xl text-indigo-600 mr-2" />
          Worker Configuration
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="p-3 bg-gray-50 rounded-lg">
            <div class="text-xs text-gray-500">
              Connection
            </div>
            <div class="text-base font-medium">
              Redis
            </div>
          </div>

          <div class="p-3 bg-gray-50 rounded-lg">
            <div class="text-xs text-gray-500">
              Workers
            </div>
            <div class="text-base font-medium">
              3
            </div>
          </div>

          <div class="p-3 bg-gray-50 rounded-lg">
            <div class="text-xs text-gray-500">
              Max Retries
            </div>
            <div class="text-base font-medium">
              3
            </div>
          </div>

          <div class="p-3 bg-gray-50 rounded-lg">
            <div class="text-xs text-gray-500">
              Timeout
            </div>
            <div class="text-base font-medium">
              60 seconds
            </div>
          </div>

          <div class="p-3 bg-gray-50 rounded-lg">
            <div class="text-xs text-gray-500">
              Balancing
            </div>
            <div class="text-base font-medium">
              Auto
            </div>
          </div>

          <div class="p-3 bg-gray-50 rounded-lg">
            <div class="text-xs text-gray-500">
              Backoff
            </div>
            <div class="text-base font-medium">
              Exponential
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.loader {
  display: inline-block;
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid rgba(79, 70, 229, 0.2);
  border-radius: 50%;
  border-top-color: #4f46e5;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
