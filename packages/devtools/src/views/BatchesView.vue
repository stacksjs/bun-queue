<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useQueueStore } from '../store/queueStore'

const _queueStore = useQueueStore()
const isLoading = ref(false)
const error = ref<string | null>(null)

// Mock data for batches
const batches = ref([
  {
    id: 'batch_abc123',
    name: 'Weekly Newsletter',
    createdAt: '2023-11-10T08:30:00Z',
    jobCount: 15,
    completedJobs: 12,
    failedJobs: 0,
    status: 'active',
    progress: 80,
    queue: 'emails',
  },
  {
    id: 'batch_def456',
    name: 'Image Processing',
    createdAt: '2023-11-09T14:15:00Z',
    jobCount: 24,
    completedJobs: 24,
    failedJobs: 0,
    status: 'completed',
    progress: 100,
    queue: 'media',
  },
  {
    id: 'batch_ghi789',
    name: 'User Import',
    createdAt: '2023-11-08T16:45:00Z',
    jobCount: 120,
    completedJobs: 98,
    failedJobs: 2,
    status: 'active',
    progress: 82,
    queue: 'imports',
  },
  {
    id: 'batch_jkl012',
    name: 'Database Backup',
    createdAt: '2023-11-07T23:00:00Z',
    jobCount: 5,
    completedJobs: 5,
    failedJobs: 0,
    status: 'completed',
    progress: 100,
    queue: 'maintenance',
  },
  {
    id: 'batch_mno345',
    name: 'Report Generation',
    createdAt: '2023-11-07T10:30:00Z',
    jobCount: 42,
    completedJobs: 39,
    failedJobs: 3,
    status: 'completed',
    progress: 100,
    queue: 'reports',
  },
])

const statusFilter = ref('all')
const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

const filteredBatches = computed(() => {
  if (statusFilter.value === 'all') {
    return batches.value
  }
  return batches.value.filter(batch => batch.status === statusFilter.value)
})

onMounted(async () => {
  await fetchBatches()
})

async function fetchBatches() {
  isLoading.value = true
  error.value = null

  try {
    // In a real implementation, you would fetch batches here
    // Example: await _queueStore.fetchBatches()

    // Simulating API delay
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  catch (err) {
    console.error('Error fetching batches:', err)
    error.value = 'Failed to load batches'
  }
  finally {
    isLoading.value = false
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date)
}

async function refreshData() {
  await fetchBatches()
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-medium text-gray-800">
        Batches
      </h2>

      <div class="flex items-center space-x-2">
        <div class="relative">
          <select
            v-model="statusFilter"
            class="pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>

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
    </div>

    <div v-if="isLoading && !batches.length" class="card p-8 text-center bg-white rounded-lg shadow-sm">
      <div class="flex justify-center items-center space-x-3">
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600 font-medium">
        Loading batches...
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

    <div v-else-if="filteredBatches.length === 0" class="card bg-white p-8 text-center rounded-lg shadow-sm">
      <span class="i-carbon-batch-job text-4xl text-gray-400 mb-3" />
      <p class="text-gray-500 font-medium">
        No batches found
      </p>
      <p class="text-gray-400 text-sm mt-1">
        Try changing your filter or creating a new batch
      </p>
    </div>

    <div v-else class="card bg-white rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="text-left text-sm font-medium text-gray-500 border-b border-gray-200">
              <th class="px-6 py-3">
                ID / Name
              </th>
              <th class="px-6 py-3">
                Queue
              </th>
              <th class="px-6 py-3">
                Created At
              </th>
              <th class="px-6 py-3">
                Jobs
              </th>
              <th class="px-6 py-3">
                Status
              </th>
              <th class="px-6 py-3">
                Progress
              </th>
              <th class="px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="batch in filteredBatches"
              :key="batch.id"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="px-6 py-4">
                <div class="font-medium text-gray-800">
                  {{ batch.name }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ batch.id }}
                </div>
              </td>
              <td class="px-6 py-4 text-gray-800">
                {{ batch.queue }}
              </td>
              <td class="px-6 py-4 text-gray-600">
                {{ formatDate(batch.createdAt) }}
              </td>
              <td class="px-6 py-4">
                <div class="font-medium">
                  {{ batch.completedJobs + batch.failedJobs }}/{{ batch.jobCount }}
                </div>
                <div class="text-xs text-gray-500">
                  <span class="text-green-600">{{ batch.completedJobs }} completed</span>
                  <span v-if="batch.failedJobs > 0" class="text-red-600 ml-1">{{ batch.failedJobs }} failed</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-blue-100 text-blue-800': batch.status === 'active',
                    'bg-green-100 text-green-800': batch.status === 'completed',
                    'bg-red-100 text-red-800': batch.status === 'failed',
                  }"
                >
                  {{ batch.status }}
                </span>
              </td>
              <td class="px-6 py-4 w-36">
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="h-2 rounded-full"
                    :class="{
                      'bg-blue-500': batch.status === 'active',
                      'bg-green-500': batch.status === 'completed',
                      'bg-red-500': batch.status === 'failed',
                    }"
                    :style="{ width: `${batch.progress}%` }"
                  />
                </div>
                <div class="text-xs text-right mt-1 text-gray-500">
                  {{ batch.progress }}%
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <router-link
                  :to="`/batches/${batch.id}`"
                  class="btn btn-outline btn-sm px-3"
                >
                  <span class="i-carbon-view mr-1" />
                  Details
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
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
