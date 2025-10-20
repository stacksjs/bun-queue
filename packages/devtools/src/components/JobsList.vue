<script setup lang="ts">
import { useRouter } from 'vue-router'
import { JobStatus } from '../types/job'

interface Job {
  id: string
  name: string
  status: string
  queue: string
  created: string
  updated: string
  data?: Record<string, any>
}

defineProps<{
  jobs: Job[]
  loading?: boolean
}>()

const router = useRouter()

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

function getStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case JobStatus.WAITING:
      return 'bg-yellow-100 text-yellow-800'
    case JobStatus.ACTIVE:
      return 'bg-blue-100 text-blue-800'
    case JobStatus.COMPLETED:
      return 'bg-green-100 text-green-800'
    case JobStatus.FAILED:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function viewJobDetails(jobId: string) {
  router.push(`/jobs/${jobId}`)
}
</script>

<template>
  <div class="overflow-x-auto">
    <div v-if="loading" class="flex justify-center p-8">
      <div class="spinner mr-2" />
      <span>Loading jobs...</span>
    </div>

    <div v-else-if="jobs.length === 0" class="text-center p-8 text-gray-500">
      No jobs found matching your search criteria
    </div>

    <table v-else class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Name
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            ID
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Queue
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Created
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Updated
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr v-for="job in jobs" :key="job.id" class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {{ job.name }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {{ job.id }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {{ job.queue }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span
              class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              :class="getStatusClass(job.status)"
            >
              {{ job.status }}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {{ formatDate(job.created) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {{ formatDate(job.updated) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button
              class="text-indigo-600 hover:text-indigo-900 cursor-pointer"
              @click="viewJobDetails(job.id)"
            >
              View Details
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.spinner {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3498db;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
