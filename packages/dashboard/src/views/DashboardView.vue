<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useQueueStore } from '../store/queueStore'
import { JobStatus } from '../types/job'

const queueStore = useQueueStore()
const error = ref<string | null>(null)

// Mock data for charts
const processingRateData = ref([42, 50, 65, 59, 80, 81, 56, 55, 72, 64, 61, 68, 75, 62, 44, 35, 41, 48])
const jobsByStatusData = computed(() => ({
  labels: [JobStatus.WAITING, JobStatus.ACTIVE, JobStatus.COMPLETED, JobStatus.FAILED],
  data: [
    queueStore.stats.waitingJobs,
    queueStore.stats.activeJobs,
    queueStore.stats.completedJobs,
    queueStore.stats.failedJobs,
  ],
}))

const queueActivityData = computed(() => {
  if (!queueStore.hasQueues)
    return []

  return queueStore.queues
    .slice(0, 5)
    .map(queue => ({
      name: queue.name,
      count: queue.jobCount,
    }))
})

onMounted(async () => {
  try {
    await Promise.all([
      queueStore.fetchQueueStats(),
      queueStore.fetchQueues(),
    ])

    // Generate processing rate data (last 18 minutes)
    processingRateData.value = Array.from({ length: 18 }, () =>
      Math.max(20, Math.floor(Math.random() * queueStore.stats.processingRate * 1.5)))
  }
  catch (err) {
    error.value = 'Failed to load dashboard data'
    console.error('Dashboard data loading error:', err)
  }
})

async function refreshData() {
  error.value = null
  try {
    await Promise.all([
      queueStore.fetchQueueStats(true),
      queueStore.fetchQueues(true),
    ])

    // Generate new processing rate data
    processingRateData.value = Array.from({ length: 18 }, () =>
      Math.max(20, Math.floor(Math.random() * queueStore.stats.processingRate * 1.5)))
  }
  catch (err) {
    error.value = 'Failed to refresh dashboard data'
    console.error('Dashboard data refresh error:', err)
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center">
        <span class="i-carbon-dashboard text-2xl text-indigo-600 mr-3" />
        <h2 class="text-2xl font-bold text-gray-800">
          Dashboard Overview
        </h2>
      </div>
      <button class="btn btn-primary flex items-center" :disabled="queueStore.isLoadingStats || queueStore.isLoadingQueues" @click="refreshData">
        <span v-if="queueStore.isLoadingStats || queueStore.isLoadingQueues" class="loader mr-2" />
        <span v-else class="i-carbon-refresh mr-2" />
        {{ queueStore.isLoadingStats || queueStore.isLoadingQueues ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="queueStore.isLoadingStats && !queueStore.hasStats" class="card p-8 text-center bg-white rounded-xl shadow-md">
      <div class="flex justify-center items-center space-x-3">
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600 font-medium">
        Loading dashboard data...
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

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <!-- Stats Cards -->
        <div class="card p-5 rounded-xl shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="rounded-full p-3.5 mr-5 shadow-md bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <div class="i-carbon-service-desk text-2xl" />
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500">
                Active Queues
              </h4>
              <p class="text-3xl font-bold mt-1">
                {{ queueStore.stats.activeQueues }}
              </p>
            </div>
          </div>
        </div>

        <div class="card p-5 rounded-xl shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="rounded-full p-3.5 mr-5 shadow-md bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <div class="i-carbon-time text-2xl" />
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500">
                Waiting Jobs
              </h4>
              <p class="text-3xl font-bold mt-1">
                {{ queueStore.stats.waitingJobs }}
              </p>
            </div>
          </div>
        </div>

        <div class="card p-5 rounded-xl shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="rounded-full p-3.5 mr-5 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div class="i-carbon-play-filled text-2xl" />
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500">
                Active Jobs
              </h4>
              <p class="text-3xl font-bold mt-1">
                {{ queueStore.stats.activeJobs }}
              </p>
            </div>
          </div>
        </div>

        <div class="card p-5 rounded-xl shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center">
            <div class="rounded-full p-3.5 mr-5 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <div class="i-carbon-checkmark text-2xl" />
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-500">
                Completed Jobs
              </h4>
              <p class="text-3xl font-bold mt-1">
                {{ queueStore.stats.completedJobs }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <!-- Processing Rate Chart -->
        <div class="card p-5 rounded-xl shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center mb-4">
            <span class="i-carbon-chart-line text-xl text-indigo-600 mr-2" />
            <h3 class="text-lg font-medium text-gray-800">
              Processing Rate (Last 18 minutes)
            </h3>
          </div>
          <div class="p-2 h-64 bg-white rounded-lg">
            <div v-if="queueStore.isLoadingStats && !queueStore.hasStats" class="flex h-full items-center justify-center">
              <div class="loader mr-2" />
              <span class="text-gray-500">Loading chart data...</span>
            </div>
            <div v-else>
              <!-- Simple bar chart implementation -->
              <div class="flex h-52 items-end justify-between">
                <div
                  v-for="(value, index) in processingRateData"
                  :key="index"
                  class="w-2 bg-indigo-500 mx-1 rounded-t-sm"
                  :style="{ height: `${Math.min(100, value / processingRateData.reduce((a, b) => Math.max(a, b), 0) * 100)}%` }"
                />
              </div>
              <div class="flex justify-between mt-2">
                <span class="text-xs text-gray-500">-18m</span>
                <span class="text-xs text-gray-500">-9m</span>
                <span class="text-xs text-gray-500">now</span>
              </div>
              <div class="text-center mt-2 text-sm text-gray-600">
                <span class="font-semibold">{{ queueStore.stats.processingRate }}</span> jobs/minute average
              </div>
            </div>
          </div>
        </div>

        <!-- Jobs by Status Chart -->
        <div class="card p-5 rounded-xl shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center mb-4">
            <span class="i-carbon-chart-pie text-xl text-indigo-600 mr-2" />
            <h3 class="text-lg font-medium text-gray-800">
              Jobs by Status
            </h3>
          </div>
          <div class="p-2 h-64 bg-white rounded-lg flex justify-center items-center">
            <div v-if="queueStore.isLoadingStats && !queueStore.hasStats" class="flex items-center">
              <div class="loader mr-2" />
              <span class="text-gray-500">Loading chart data...</span>
            </div>
            <template v-else>
              <!-- Simple pie chart implementation -->
              <div class="relative w-48 h-48">
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="text-center">
                    <div class="text-3xl font-bold text-gray-800">
                      {{ jobsByStatusData.data.reduce((a, b) => a + b, 0) }}
                    </div>
                    <div class="text-sm text-gray-500">
                      Total Jobs
                    </div>
                  </div>
                </div>
                <!-- Colored segments -->
                <svg viewBox="0 0 100 100" class="absolute inset-0">
                  <circle
                    cx="50" cy="50" r="45" fill="transparent" stroke="#f59e0b" stroke-width="10"
                    stroke-dasharray="282.6" stroke-dashoffset="0"
                  />
                  <circle
                    cx="50" cy="50" r="45" fill="transparent" stroke="#3b82f6" stroke-width="10"
                    stroke-dasharray="282.6" stroke-dashoffset="211.95"
                  />
                  <circle
                    cx="50" cy="50" r="45" fill="transparent" stroke="#10b981" stroke-width="10"
                    stroke-dasharray="282.6" stroke-dashoffset="197.82"
                  />
                  <circle
                    cx="50" cy="50" r="45" fill="transparent" stroke="#ef4444" stroke-width="10"
                    stroke-dasharray="282.6" stroke-dashoffset="14.13"
                  />
                </svg>
              </div>
              <!-- Legend -->
              <div class="ml-4 space-y-3">
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-amber-500 rounded-full mr-2" />
                  <span class="text-sm text-gray-600">Waiting ({{ jobsByStatusData.data[0] }})</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                  <span class="text-sm text-gray-600">Active ({{ jobsByStatusData.data[1] }})</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-emerald-500 rounded-full mr-2" />
                  <span class="text-sm text-gray-600">Completed ({{ jobsByStatusData.data[2] }})</span>
                </div>
                <div class="flex items-center">
                  <div class="w-3 h-3 bg-red-500 rounded-full mr-2" />
                  <span class="text-sm text-gray-600">Failed ({{ jobsByStatusData.data[3] }})</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Queue Activity -->
      <div class="card p-5 rounded-xl shadow hover:shadow-lg transition-shadow">
        <div class="flex items-center mb-6">
          <span class="i-carbon-analytics text-xl text-indigo-600 mr-2" />
          <h3 class="text-lg font-medium text-gray-800">
            Queue Activity
          </h3>
        </div>

        <div v-if="queueStore.isLoadingQueues && !queueStore.hasQueues" class="py-8 text-center">
          <div class="loader mx-auto mb-4" />
          <p class="text-gray-500">
            Loading queue data...
          </p>
        </div>

        <div v-else-if="queueActivityData.length === 0" class="py-8 text-center text-gray-500">
          No queue data available
        </div>

        <div v-else class="space-y-4">
          <div v-for="queue in queueActivityData" :key="queue.name" class="flex items-center">
            <span class="w-32 text-sm text-gray-600 truncate">{{ queue.name }}</span>
            <div class="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden mx-4">
              <div
                class="h-full bg-indigo-500 rounded-full"
                :style="{ width: `${Math.min(100, queue.count / queueActivityData.reduce((max, q) => Math.max(max, q.count), 0) * 100)}%` }"
              />
            </div>
            <span class="text-sm font-medium">{{ queue.count }} jobs</span>
          </div>
        </div>

        <div class="mt-6 text-right">
          <router-link to="/queues" class="btn btn-outline">
            View All Queues
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loader {
  display: inline-block;
  width: 1rem;
  height: 1rem;
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
