<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useQueueStore } from '../store/queueStore'

const queueStore = useQueueStore()
const isLoading = ref(false)
const error = ref<string | null>(null)

// Mock data for monitoring stats
const monitoringStats = ref({
  supervisors: [
    {
      name: 'supervisor-1',
      status: 'running',
      queues: ['default', 'emails', 'notifications'],
      processes: 2,
      jobsProcessed: 1245,
      uptime: '2 days, 5 hours',
      memoryUsage: '128 MB',
    },
  ],
  workers: [
    { id: 'worker-1', supervisor: 'supervisor-1', status: 'running', queue: 'default', jobsProcessed: 568, uptime: '2 days, 5 hours' },
    { id: 'worker-2', supervisor: 'supervisor-1', status: 'running', queue: 'emails', jobsProcessed: 423, uptime: '2 days, 5 hours' },
    { id: 'worker-3', supervisor: 'supervisor-1', status: 'running', queue: 'notifications', jobsProcessed: 254, uptime: '2 days, 5 hours' },
  ],
})

onMounted(async () => {
  await fetchMonitoringData()
})

async function fetchMonitoringData() {
  isLoading.value = true
  error.value = null

  try {
    // In a real implementation, you would fetch monitoring data here
    // Example: await queueStore.fetchMonitoringData()

    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  catch (err) {
    console.error('Error fetching monitoring data:', err)
    error.value = 'Failed to load monitoring data'
  }
  finally {
    isLoading.value = false
  }
}

async function refreshData() {
  await fetchMonitoringData()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-medium text-gray-800">
        Monitoring
      </h2>

      <button
        class="btn btn-primary flex items-center"
        :disabled="isLoading"
        @click="refreshData"
      >
        <span v-if="isLoading" class="loader mr-2" />
        <span v-else class="i-carbon-refresh mr-2" />
        {{ isLoading ? 'Loading...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="isLoading && !monitoringStats.supervisors.length" class="card p-8 text-center bg-white rounded-lg shadow-sm">
      <div class="flex justify-center items-center space-x-3">
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600 font-medium">
        Loading monitoring data...
      </p>
    </div>

    <div v-else-if="error" class="card bg-red-50 border border-red-200 text-red-600 p-8 text-center rounded-lg shadow-sm">
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
      <!-- Supervisors -->
      <div class="card bg-white rounded-lg shadow-sm mb-6">
        <div class="px-6 pt-6 pb-3">
          <h3 class="text-lg font-medium text-gray-800">
            Supervisors
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                <th class="px-6 py-3">
                  Name
                </th>
                <th class="px-6 py-3">
                  Status
                </th>
                <th class="px-6 py-3">
                  Processes
                </th>
                <th class="px-6 py-3">
                  Jobs Processed
                </th>
                <th class="px-6 py-3">
                  Uptime
                </th>
                <th class="px-6 py-3">
                  Memory
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="supervisor in monitoringStats.supervisors"
                :key="supervisor.name"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="px-6 py-4 font-medium text-gray-800">
                  {{ supervisor.name }}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800': supervisor.status === 'running',
                      'bg-yellow-100 text-yellow-800': supervisor.status === 'paused',
                      'bg-red-100 text-red-800': supervisor.status === 'stopped',
                    }"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full mr-1.5"
                      :class="{
                        'bg-green-500': supervisor.status === 'running',
                        'bg-yellow-500': supervisor.status === 'paused',
                        'bg-red-500': supervisor.status === 'stopped',
                      }"
                    />
                    {{ supervisor.status }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  {{ supervisor.processes }}
                </td>
                <td class="px-6 py-4">
                  {{ supervisor.jobsProcessed }}
                </td>
                <td class="px-6 py-4 text-gray-600">
                  {{ supervisor.uptime }}
                </td>
                <td class="px-6 py-4 text-gray-600">
                  {{ supervisor.memoryUsage }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Workers -->
      <div class="card bg-white rounded-lg shadow-sm">
        <div class="px-6 pt-6 pb-3">
          <h3 class="text-lg font-medium text-gray-800">
            Process Workers
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                <th class="px-6 py-3">
                  ID
                </th>
                <th class="px-6 py-3">
                  Supervisor
                </th>
                <th class="px-6 py-3">
                  Status
                </th>
                <th class="px-6 py-3">
                  Queue
                </th>
                <th class="px-6 py-3">
                  Jobs Processed
                </th>
                <th class="px-6 py-3">
                  Uptime
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="worker in monitoringStats.workers"
                :key="worker.id"
                class="border-b border-gray-100 hover:bg-gray-50"
              >
                <td class="px-6 py-4 font-medium text-gray-800">
                  {{ worker.id }}
                </td>
                <td class="px-6 py-4">
                  {{ worker.supervisor }}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800': worker.status === 'running',
                      'bg-yellow-100 text-yellow-800': worker.status === 'paused',
                      'bg-red-100 text-red-800': worker.status === 'stopped',
                    }"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full mr-1.5"
                      :class="{
                        'bg-green-500': worker.status === 'running',
                        'bg-yellow-500': worker.status === 'paused',
                        'bg-red-500': worker.status === 'stopped',
                      }"
                    />
                    {{ worker.status }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  {{ worker.queue }}
                </td>
                <td class="px-6 py-4">
                  {{ worker.jobsProcessed }}
                </td>
                <td class="px-6 py-4 text-gray-600">
                  {{ worker.uptime }}
                </td>
              </tr>
            </tbody>
          </table>
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
