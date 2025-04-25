<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { JobStatus } from '../types/job'

const route = useRoute()
const router = useRouter()
const jobId = route.params.id as string
const job = ref<any>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await fetchJobDetails(jobId)
    isLoading.value = false
  }
  catch (e) {
    error.value = 'Failed to load job details'
    isLoading.value = false
  }
})

async function fetchJobDetails(id: string) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800))

  // Mock data
  if (id === 'job_1a2b3c') {
    job.value = {
      id: 'job_1a2b3c',
      name: 'Send Welcome Email',
      status: JobStatus.COMPLETED,
      queue: 'Email Queue',
      created: '2023-10-15 09:15:22',
      updated: '2023-10-15 09:15:45',
      data: {
        recipient: 'john.doe@example.com',
        template: 'welcome_template',
        sent: true,
        subject: 'Welcome to Our Platform',
        deliveryStatus: 'delivered',
        openedAt: '2023-10-15 10:22:15',
      },
      result: {
        success: true,
        deliveryId: 'del_38fj20sdk',
        messageId: 'msg_294jf9sj',
      },
      executionTime: 23, // seconds
      attempts: 1,
      priority: 'high',
      tags: ['email', 'onboarding', 'customer'],
    }
  }
  else {
    // Generate mock data for any other job ID
    job.value = {
      id,
      name: `Generic Job ${id.substring(id.length - 4)}`,
      status: getRandomStatus(),
      queue: getRandomQueue(),
      created: randomDate(),
      updated: randomDate(),
      data: {
        param1: 'value1',
        param2: 'value2',
        param3: true,
      },
      result: Math.random() > 0.3 ? { success: true } : { success: false, error: 'Timeout error' },
      executionTime: Math.floor(Math.random() * 120),
      attempts: Math.floor(Math.random() * 3) + 1,
      priority: Math.random() > 0.7 ? 'high' : 'normal',
      tags: ['tag1', 'tag2'],
    }
  }
}

function getRandomStatus() {
  const statuses = [JobStatus.COMPLETED, JobStatus.ACTIVE, JobStatus.WAITING, JobStatus.FAILED]
  return statuses[Math.floor(Math.random() * statuses.length)]
}

function getRandomQueue() {
  const queues = ['Email Queue', 'Image Processing', 'Data Import', 'Report Generation', 'Push Notifications']
  return queues[Math.floor(Math.random() * queues.length)]
}

function randomDate() {
  const now = new Date()
  const pastDate = new Date(now.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
  return pastDate.toISOString().replace('T', ' ').substring(0, 19)
}

function getStatusClass(status: string): string {
  switch (status) {
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

function goBack() {
  router.back()
}
</script>

<template>
  <div>
    <div class="flex items-center space-x-3 mb-6">
      <button class="btn btn-outline p-2" @click="goBack">
        <span class="i-carbon-arrow-left text-xl" />
      </button>
      <h2 class="text-2xl font-bold">
        Job Details
      </h2>
    </div>

    <div v-if="isLoading" class="card p-8 text-center">
      <div class="flex justify-center items-center space-x-2">
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600">
        Loading job details...
      </p>
    </div>

    <div v-else-if="error" class="card bg-danger/10 text-danger p-8 text-center">
      <p>{{ error }}</p>
      <button class="btn btn-primary mt-4" @click="fetchJobDetails(jobId)">
        Retry
      </button>
    </div>

    <div v-else-if="job" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Job summary card -->
      <div class="md:col-span-2 card p-6">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-semibold">
              {{ job.name }}
            </h3>
            <p class="text-gray-500 text-sm">
              ID: {{ job.id }}
            </p>
          </div>
          <span
            class="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full"
            :class="getStatusClass(job.status)"
          >
            {{ job.status }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-4 mt-6">
          <div>
            <p class="text-gray-500 text-sm">
              Queue
            </p>
            <p class="font-medium">
              {{ job.queue }}
            </p>
          </div>
          <div>
            <p class="text-gray-500 text-sm">
              Priority
            </p>
            <p class="font-medium capitalize">
              {{ job.priority }}
            </p>
          </div>
          <div>
            <p class="text-gray-500 text-sm">
              Created
            </p>
            <p class="font-medium">
              {{ job.created }}
            </p>
          </div>
          <div>
            <p class="text-gray-500 text-sm">
              Updated
            </p>
            <p class="font-medium">
              {{ job.updated }}
            </p>
          </div>
          <div>
            <p class="text-gray-500 text-sm">
              Execution Time
            </p>
            <p class="font-medium">
              {{ job.executionTime }}s
            </p>
          </div>
          <div>
            <p class="text-gray-500 text-sm">
              Attempts
            </p>
            <p class="font-medium">
              {{ job.attempts }}
            </p>
          </div>
        </div>

        <div class="mt-6">
          <p class="text-gray-500 text-sm mb-2">
            Tags
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in job.tags"
              :key="tag"
              class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <!-- Job actions card -->
      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4">
          Actions
        </h3>
        <div class="space-y-3">
          <button v-if="job.status === 'waiting'" class="btn btn-primary w-full">
            Run Now
          </button>
          <button v-if="job.status === 'active'" class="btn bg-orange-500 text-white w-full">
            Cancel Job
          </button>
          <button v-if="job.status === 'failed'" class="btn btn-primary w-full">
            Retry Job
          </button>
          <button class="btn btn-outline w-full">
            Clone Job
          </button>
          <button class="btn btn-danger w-full">
            Delete Job
          </button>
        </div>
      </div>

      <!-- Job data card -->
      <div class="card p-6 md:col-span-2">
        <h3 class="text-lg font-semibold mb-4">
          Job Data
        </h3>
        <pre class="bg-gray-50 p-4 rounded overflow-auto max-h-64">{{ JSON.stringify(job.data, null, 2) }}</pre>
      </div>

      <!-- Job result card -->
      <div class="card p-6">
        <h3 class="text-lg font-semibold mb-4">
          Result
        </h3>
        <pre
          class="bg-gray-50 p-4 rounded overflow-auto max-h-64"
          :class="{ 'bg-red-50': job.result && !job.result.success }"
        >{{ JSON.stringify(job.result, null, 2) }}</pre>
      </div>
    </div>

    <div v-else class="card bg-gray-50 p-8 text-center">
      <p>Job not found</p>
      <button class="btn btn-primary mt-4" @click="goBack">
        Back to Jobs
      </button>
    </div>
  </div>
</template>
