<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useQueueStore } from '../store/queueStore'
import { JobStatus } from '../types/job'

const queueStore = useQueueStore()
const error = ref<string | null>(null)
const isLoading = ref(false)

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

// Mock data for groups and batches
const groupData = ref([
  { name: 'Daily Reports', jobCount: 45, completionRate: 78, activeJobs: 3 },
  { name: 'User Notifications', jobCount: 128, completionRate: 62, activeJobs: 12 },
  { name: 'Data Exports', jobCount: 34, completionRate: 91, activeJobs: 1 },
])

const recentBatches = ref([
  { id: 'batch_abc123', name: 'Weekly Newsletter', jobCount: 15, completedJobs: 12, status: 'active' },
  { id: 'batch_def456', name: 'Image Processing', jobCount: 24, completedJobs: 24, status: 'completed' },
  { id: 'batch_ghi789', name: 'User Import', jobCount: 120, completedJobs: 98, status: 'active' },
])

onMounted(async () => {
  await fetchDashboardData()
})

async function fetchDashboardData(forceRefresh = false) {
  error.value = null
  isLoading.value = true

  try {
    await Promise.all([
      queueStore.fetchQueueStats(forceRefresh),
      queueStore.fetchQueues(forceRefresh),
    ])

    // Generate processing rate data (last 18 minutes)
    processingRateData.value = Array.from({ length: 18 }, () =>
      Math.max(20, Math.floor(Math.random() * queueStore.stats.processingRate * 1.5)))

    // In a real implementation, you would fetch groups and batches data here
    // await queueStore.fetchGroups(forceRefresh)
    // await queueStore.fetchBatches(forceRefresh)
  }
  catch (err) {
    error.value = 'Failed to load dashboard data'
    console.error('Dashboard data loading error:', err)
  }
  finally {
    isLoading.value = false
  }
}

async function refreshData() {
  await fetchDashboardData(true)
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-2xl font-medium text-gray-800">
        Overview
      </h2>
    </div>

    <div v-if="isLoading && !queueStore.hasStats" class="card p-8 text-center bg-white rounded-xl shadow-md">
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
      <!-- Metrics overview (Horizon style) -->
      <div class="card bg-white rounded-lg shadow-sm mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <!-- Jobs Per Minute -->
          <div class="p-6 border-b md:border-r border-gray-100 md:border-b-0">
            <div class="text-sm font-medium text-gray-500 mb-1">
              Jobs Per Minute
            </div>
            <div class="text-2xl font-semibold">
              {{ queueStore.stats.processingRate }}
            </div>
          </div>

          <!-- Jobs Past Hour -->
          <div class="p-6 border-b lg:border-r border-gray-100 lg:border-b-0">
            <div class="text-sm font-medium text-gray-500 mb-1">
              Jobs Past Hour
            </div>
            <div class="text-2xl font-semibold">
              {{ queueStore.stats.completedJobs }}
            </div>
          </div>

          <!-- Failed Jobs Past 7 Days -->
          <div class="p-6 border-b md:border-r md:border-b-0 border-gray-100">
            <div class="text-sm font-medium text-gray-500 mb-1">
              Failed Jobs Past 7 Days
            </div>
            <div class="text-2xl font-semibold">
              {{ queueStore.stats.failedJobs }}
            </div>
          </div>

          <!-- Status -->
          <div class="p-6">
            <div class="text-sm font-medium text-gray-500 mb-1">
              Status
            </div>
            <div class="flex items-center">
              <span class="w-2 h-2 bg-green-500 rounded-full mr-2" />
              <span class="text-2xl font-semibold text-green-600">Active</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Workload -->
      <div class="card bg-white rounded-lg shadow-sm mb-6">
        <div class="px-6 pt-6 pb-3">
          <h3 class="text-lg font-medium text-gray-800">
            Current Workload
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                <th class="px-6 py-3">
                  Queue
                </th>
                <th class="px-6 py-3">
                  Jobs
                </th>
                <th class="px-6 py-3">
                  Processes
                </th>
                <th class="px-6 py-3">
                  Wait
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="queue in queueActivityData" :key="queue.name" class="border-b border-gray-100">
                <td class="px-6 py-4 text-gray-800">
                  {{ queue.name }}
                </td>
                <td class="px-6 py-4">
                  {{ queue.count }}
                </td>
                <td class="px-6 py-4">
                  {{ Math.max(1, Math.floor(Math.random() * 4)) }}
                </td>
                <td class="px-6 py-4 text-gray-600">
                  A few seconds
                </td>
              </tr>
              <tr v-if="queueActivityData.length === 0">
                <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                  No queue data available
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Supervisors -->
      <div class="card bg-white rounded-lg shadow-sm mb-6">
        <div class="px-6 pt-6 pb-3">
          <h3 class="text-lg font-medium text-gray-800">
            Supervisor
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                <th class="px-6 py-3">
                  Supervisor
                </th>
                <th class="px-6 py-3">
                  Queues
                </th>
                <th class="px-6 py-3">
                  Processes
                </th>
                <th class="px-6 py-3">
                  Balancing
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-gray-100">
                <td class="px-6 py-4 text-gray-800">
                  supervisor-1
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(queue, i) in queueActivityData.slice(0, 3)" :key="i"
                      class="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                    >
                      {{ queue.name }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  2
                </td>
                <td class="px-6 py-4 text-gray-600">
                  Auto
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <!-- Processing Rate Chart -->
        <div class="card p-5 rounded-xl shadow-sm bg-white">
          <div class="flex items-center mb-4">
            <span class="i-carbon-chart-line text-xl text-indigo-600 mr-2" />
            <h3 class="text-lg font-medium text-gray-800">
              Processing Rate (Last 18 minutes)
            </h3>
          </div>
          <div class="p-2 h-64 bg-white rounded-lg">
            <div v-if="isLoading && !queueStore.hasStats" class="flex h-full items-center justify-center">
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
        <div class="card p-5 rounded-xl shadow-sm bg-white">
          <div class="flex items-center mb-4">
            <span class="i-carbon-chart-pie text-xl text-indigo-600 mr-2" />
            <h3 class="text-lg font-medium text-gray-800">
              Jobs by Status
            </h3>
          </div>
          <div class="p-2 h-64 bg-white rounded-lg flex justify-center items-center">
            <div v-if="isLoading && !queueStore.hasStats" class="flex items-center">
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

      <!-- Group Activity Section -->
      <div class="card p-5 rounded-xl shadow-sm bg-white mb-8">
        <div class="flex items-center mb-6">
          <span class="i-carbon-group text-xl text-indigo-600 mr-2" />
          <h3 class="text-lg font-medium text-gray-800">
            Job Groups
          </h3>
        </div>

        <div v-if="isLoading" class="py-8 text-center">
          <div class="loader mx-auto mb-4" />
          <p class="text-gray-500">
            Loading group data...
          </p>
        </div>

        <div v-else-if="groupData.length === 0" class="py-8 text-center text-gray-500">
          No group data available
        </div>

        <div v-else>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div v-for="group in groupData" :key="group.name" class="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-medium text-gray-800">
                  {{ group.name }}
                </h4>
                <span class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{{ group.activeJobs }} active</span>
              </div>

              <div class="mt-3">
                <div class="flex justify-between text-xs mb-1">
                  <span>Completion</span>
                  <span>{{ group.completionRate }}%</span>
                </div>
                <div class="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-indigo-500 rounded-full"
                    :style="{ width: `${group.completionRate}%` }"
                  />
                </div>
              </div>

              <div class="mt-3 text-sm text-gray-600">
                {{ group.jobCount }} total jobs
              </div>
            </div>
          </div>

          <div class="text-right mt-4">
            <router-link to="/groups" class="btn btn-outline text-sm">
              <span class="i-carbon-list-checked mr-2" />
              View All Groups
            </router-link>
          </div>
        </div>
      </div>

      <!-- Recent Batches Section -->
      <div class="card p-5 rounded-xl shadow-sm bg-white mb-8">
        <div class="flex items-center mb-6">
          <span class="i-carbon-batch-job text-xl text-indigo-600 mr-2" />
          <h3 class="text-lg font-medium text-gray-800">
            Recent Batches
          </h3>
        </div>

        <div v-if="isLoading" class="py-8 text-center">
          <div class="loader mx-auto mb-4" />
          <p class="text-gray-500">
            Loading batch data...
          </p>
        </div>

        <div v-else-if="recentBatches.length === 0" class="py-8 text-center text-gray-500">
          No batch data available
        </div>

        <div v-else>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="text-left border-b border-gray-200">
                  <th class="pb-3 font-medium text-gray-500">
                    Batch Name
                  </th>
                  <th class="pb-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th class="pb-3 font-medium text-gray-500">
                    Progress
                  </th>
                  <th class="pb-3 font-medium text-gray-500 text-right">
                    Jobs
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="batch in recentBatches" :key="batch.id" class="border-b border-gray-100">
                  <td class="py-3">
                    <div class="font-medium text-gray-800">
                      {{ batch.name }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ batch.id }}
                    </div>
                  </td>
                  <td class="py-3">
                    <span
                      class="px-2 py-1 text-xs rounded-full"
                      :class="{
                        'bg-blue-100 text-blue-700': batch.status === 'active',
                        'bg-emerald-100 text-emerald-700': batch.status === 'completed',
                        'bg-amber-100 text-amber-700': batch.status === 'waiting',
                        'bg-red-100 text-red-700': batch.status === 'failed',
                      }"
                    >
                      {{ batch.status }}
                    </span>
                  </td>
                  <td class="py-3">
                    <div class="flex items-center">
                      <div class="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          class="bg-indigo-500 h-2 rounded-full"
                          :style="{ width: `${(batch.completedJobs / batch.jobCount) * 100}%` }"
                        />
                      </div>
                      <span class="text-sm">{{ Math.round((batch.completedJobs / batch.jobCount) * 100) }}%</span>
                    </div>
                  </td>
                  <td class="py-3 text-right">
                    <span class="font-medium">{{ batch.completedJobs }}</span>
                    <span class="text-gray-500">/{{ batch.jobCount }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="text-right mt-4">
            <router-link to="/batches" class="btn btn-outline text-sm">
              <span class="i-carbon-list mr-2" />
              View All Batches
            </router-link>
          </div>
        </div>
      </div>

      <!-- Queue Activity -->
      <div class="card p-5 rounded-xl shadow-sm bg-white">
        <div class="flex items-center mb-6">
          <span class="i-carbon-analytics text-xl text-indigo-600 mr-2" />
          <h3 class="text-lg font-medium text-gray-800">
            Queue Activity
          </h3>
        </div>

        <div v-if="isLoading && !queueStore.hasQueues" class="py-8 text-center">
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
          <router-link to="/queues" class="btn btn-outline text-sm">
            <span class="i-carbon-list-boxes mr-2" />
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
