<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQueueStore } from '../store/queueStore'

const route = useRoute()
const router = useRouter()
const _queueStore = useQueueStore()
const batchId = computed(() => route.params.id as string)

const isLoading = ref(false)
const error = ref<string | null>(null)

// Mock data for batch details
const batch = ref({
  id: '',
  name: '',
  description: '',
  createdAt: '',
  completedAt: null as string | null,
  jobCount: 0,
  completedJobs: 0,
  failedJobs: 0,
  status: '',
  progress: 0,
  queue: '',
  options: {},
  jobs: [] as any[],
})

// Jobs list with pagination
const currentPage = ref(1)
const perPage = 10
const totalPages = computed(() => Math.ceil(batch.value.jobs.length / perPage))
const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * perPage
  const end = start + perPage
  return batch.value.jobs.slice(start, end)
})

// Job status filter
const statusFilter = ref('all')
const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

const filteredJobs = computed(() => {
  if (statusFilter.value === 'all') {
    return batch.value.jobs
  }
  return batch.value.jobs.filter(job => job.status === statusFilter.value)
})

onMounted(async () => {
  await fetchBatchDetails()
})

async function fetchBatchDetails() {
  isLoading.value = true
  error.value = null

  try {
    // In a real implementation, you would fetch batch details
    // Example: const data = await _queueStore.fetchBatchDetails(batchId.value)

    // For mock data, let's set a batch based on the ID
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock generation of batch details
    const mockBatch = {
      id: batchId.value,
      name: batchId.value.includes('abc') ? 'Weekly Newsletter' : 'Data Export',
      description: 'Batch processing for automated tasks',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: batchId.value.includes('def') ? new Date().toISOString() : null,
      jobCount: 24,
      completedJobs: 18,
      failedJobs: 2,
      status: batchId.value.includes('def') ? 'completed' : 'active',
      progress: batchId.value.includes('def') ? 100 : 75,
      queue: 'emails',
      options: {
        retries: 3,
        timeout: 60000,
        priority: 'high',
      },
      jobs: Array.from({ length: 24 }, (_, i) => {
        const status = i < 18 ? 'completed' : i < 20 ? 'failed' : i < 22 ? 'active' : 'waiting'
        return {
          id: `job_${i}_${batchId.value}`,
          name: `Job ${i + 1}`,
          status,
          createdAt: new Date(Date.now() - 86400000 + (i * 3600000)).toISOString(),
          processedAt: status !== 'waiting' ? new Date(Date.now() - 86400000 + (i * 3600000) + 1800000).toISOString() : null,
          completedAt: status === 'completed' || status === 'failed' ? new Date(Date.now() - 86400000 + (i * 3600000) + 3600000).toISOString() : null,
          attempts: status === 'failed' ? 3 : status === 'completed' ? 1 : 0,
          error: status === 'failed' ? 'Connection timeout' : null,
        }
      }),
    }

    batch.value = mockBatch
  }
  catch (err) {
    console.error('Error fetching batch details:', err)
    error.value = 'Failed to load batch details'
  }
  finally {
    isLoading.value = false
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString)
    return '-'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date)
}

function changePage(page: number) {
  currentPage.value = page
}

function goToJobDetails(jobId: string) {
  router.push(`/jobs/${jobId}`)
}

async function refreshData() {
  await fetchBatchDetails()
}

function cancelBatch() {
  // In a real implementation, this would call an API to cancel the batch
  alert('Cancel batch operation would happen here')
}

function retryBatch() {
  // In a real implementation, this would call an API to retry the batch
  alert('Retry batch operation would happen here')
}
</script>

<template>
  <div>
    <div class="flex items-center mb-6">
      <router-link to="/batches" class="text-gray-500 hover:text-indigo-600 mr-2">
        <span class="i-carbon-arrow-left text-xl" />
      </router-link>
      <h2 class="text-2xl font-medium text-gray-800">
        Batch Details
      </h2>
    </div>

    <div v-if="isLoading && !batch.id" class="card p-8 text-center bg-white rounded-lg shadow-sm">
      <div class="flex justify-center items-center space-x-3">
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600 font-medium">
        Loading batch details...
      </p>
    </div>

    <div v-else-if="error" class="card bg-red-50 border border-red-200 text-red-600 p-8 text-center rounded-lg shadow-sm">
      <span class="i-carbon-warning-alt text-4xl text-red-500 mb-3" />
      <p class="font-medium">
        {{ error }}
      </p>
      <div class="mt-5 space-x-3">
        <button class="btn btn-primary px-6 py-2.5" @click="refreshData">
          <span class="i-carbon-restart mr-2" />
          Retry
        </button>
        <router-link to="/batches" class="btn btn-outline px-6 py-2.5">
          <span class="i-carbon-list mr-2" />
          Back to Batches
        </router-link>
      </div>
    </div>

    <div v-else>
      <!-- Batch Overview Card -->
      <div class="card bg-white rounded-lg shadow-sm mb-6 p-6">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-medium text-gray-800">
              {{ batch.name }}
            </h3>
            <p class="text-sm text-gray-500 mt-1">
              {{ batch.id }}
            </p>
          </div>

          <div class="flex items-center space-x-2">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
              :class="{
                'bg-blue-100 text-blue-800': batch.status === 'active',
                'bg-green-100 text-green-800': batch.status === 'completed',
                'bg-red-100 text-red-800': batch.status === 'failed',
              }"
            >
              <span
                class="w-1.5 h-1.5 rounded-full mr-1.5"
                :class="{
                  'bg-blue-500': batch.status === 'active',
                  'bg-green-500': batch.status === 'completed',
                  'bg-red-500': batch.status === 'failed',
                }"
              />
              {{ batch.status }}
            </span>

            <button
              class="btn btn-primary btn-sm flex items-center"
              :disabled="isLoading"
              @click="refreshData"
            >
              <span v-if="isLoading" class="loader mr-1" />
              <span v-else class="i-carbon-refresh mr-1" />
              {{ isLoading ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div>
            <div class="text-sm font-medium text-gray-500 mb-1">
              Queue
            </div>
            <div class="text-lg font-medium">
              {{ batch.queue }}
            </div>
          </div>

          <div>
            <div class="text-sm font-medium text-gray-500 mb-1">
              Created At
            </div>
            <div class="text-lg font-medium">
              {{ formatDate(batch.createdAt) }}
            </div>
          </div>

          <div>
            <div class="text-sm font-medium text-gray-500 mb-1">
              Completed At
            </div>
            <div class="text-lg font-medium">
              {{ formatDate(batch.completedAt) }}
            </div>
          </div>
        </div>

        <div class="mt-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-500">Progress</span>
            <span class="text-sm font-medium">{{ batch.progress }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2.5">
            <div
              class="h-2.5 rounded-full"
              :class="{
                'bg-blue-500': batch.status === 'active',
                'bg-green-500': batch.status === 'completed',
                'bg-red-500': batch.status === 'failed',
              }"
              :style="{ width: `${batch.progress}%` }"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm font-medium text-gray-500 mb-1">
              Total Jobs
            </div>
            <div class="text-2xl font-semibold">
              {{ batch.jobCount }}
            </div>
          </div>

          <div class="bg-blue-50 rounded-lg p-4">
            <div class="text-sm font-medium text-blue-700 mb-1">
              Active Jobs
            </div>
            <div class="text-2xl font-semibold text-blue-700">
              {{ batch.jobCount - batch.completedJobs - batch.failedJobs }}
            </div>
          </div>

          <div class="bg-green-50 rounded-lg p-4">
            <div class="text-sm font-medium text-green-700 mb-1">
              Completed Jobs
            </div>
            <div class="text-2xl font-semibold text-green-700">
              {{ batch.completedJobs }}
            </div>
          </div>

          <div class="bg-red-50 rounded-lg p-4">
            <div class="text-sm font-medium text-red-700 mb-1">
              Failed Jobs
            </div>
            <div class="text-2xl font-semibold text-red-700">
              {{ batch.failedJobs }}
            </div>
          </div>
        </div>

        <div class="mt-6 pt-6 border-t border-gray-100 flex justify-between">
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">
              Batch Options
            </h4>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div v-for="(value, key) in batch.options" :key="key" class="flex">
                <span class="text-gray-500 mr-2">{{ key }}:</span>
                <span class="text-gray-900">{{ value }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-start space-x-2">
            <button
              v-if="batch.status === 'active'"
              class="btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
              @click="cancelBatch"
            >
              <span class="i-carbon-stop mr-1" />
              Cancel Batch
            </button>

            <button
              v-if="batch.failedJobs > 0"
              class="btn btn-outline btn-sm text-indigo-600 border-indigo-300 hover:bg-indigo-50"
              @click="retryBatch"
            >
              <span class="i-carbon-restart mr-1" />
              Retry Failed
            </button>
          </div>
        </div>
      </div>

      <!-- Jobs List -->
      <div class="card bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="px-6 pt-6 pb-3 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-800">
            Batch Jobs
          </h3>

          <div class="relative">
            <select
              v-model="statusFilter"
              class="pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-left text-sm font-medium text-gray-500 border-b border-gray-200">
                <th class="px-6 py-3">
                  ID / Name
                </th>
                <th class="px-6 py-3">
                  Status
                </th>
                <th class="px-6 py-3">
                  Created
                </th>
                <th class="px-6 py-3">
                  Processed
                </th>
                <th class="px-6 py-3">
                  Completed
                </th>
                <th class="px-6 py-3">
                  Attempts
                </th>
                <th class="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              <template v-if="filteredJobs.length === 0">
                <tr>
                  <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <div class="i-carbon-search text-4xl mx-auto mb-2 opacity-30" />
                    <p>No jobs found with the selected filter</p>
                  </td>
                </tr>
              </template>
              <template v-else>
                <tr
                  v-for="job in paginatedJobs"
                  :key="job.id"
                  class="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td class="px-6 py-4">
                    <div class="font-medium text-gray-800">
                      {{ job.name }}
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ job.id }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="{
                        'bg-amber-100 text-amber-800': job.status === 'waiting',
                        'bg-blue-100 text-blue-800': job.status === 'active',
                        'bg-green-100 text-green-800': job.status === 'completed',
                        'bg-red-100 text-red-800': job.status === 'failed',
                      }"
                    >
                      {{ job.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-gray-600 text-sm">
                    {{ formatDate(job.createdAt) }}
                  </td>
                  <td class="px-6 py-4 text-gray-600 text-sm">
                    {{ formatDate(job.processedAt) }}
                  </td>
                  <td class="px-6 py-4 text-gray-600 text-sm">
                    {{ formatDate(job.completedAt) }}
                  </td>
                  <td class="px-6 py-4">
                    <span
                      v-if="job.status === 'failed'"
                      class="text-sm text-red-600 font-medium"
                    >
                      {{ job.attempts }} / 3
                    </span>
                    <span v-else class="text-sm text-gray-600">
                      {{ job.attempts }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button
                      class="btn btn-outline btn-sm px-3"
                      @click="goToJobDetails(job.id)"
                    >
                      <span class="i-carbon-view mr-1" />
                      Details
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="px-6 py-4 border-t border-gray-100 flex justify-between items-center"
        >
          <div class="text-sm text-gray-500">
            Showing {{ (currentPage - 1) * perPage + 1 }} to {{ Math.min(currentPage * perPage, filteredJobs.length) }} of {{ filteredJobs.length }} jobs
          </div>

          <div class="flex space-x-1">
            <button
              class="btn btn-sm btn-outline px-3"
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              <span class="i-carbon-chevron-left" />
            </button>

            <button
              v-for="page in totalPages"
              :key="page"
              class="btn btn-sm px-3"
              :class="page === currentPage ? 'btn-primary' : 'btn-outline'"
              @click="changePage(page)"
            >
              {{ page }}
            </button>

            <button
              class="btn btn-sm btn-outline px-3"
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
            >
              <span class="i-carbon-chevron-right" />
            </button>
          </div>
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
