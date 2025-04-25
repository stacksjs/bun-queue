<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { JobStatus } from '../types/job'

const route = useRoute()
const router = useRouter()
const jobId = route.params.id as string
const job = ref<any>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const showCloneConfirm = ref(false)
const showDeleteConfirm = ref(false)

onMounted(async () => {
  try {
    await fetchJobDetails(jobId)
    isLoading.value = false
    // Apply syntax highlighting after job data is loaded
    await nextTick()
    applyJsonHighlighting()
  }
  catch (err) {
    error.value = 'Failed to load job details'
    isLoading.value = false
    console.error('Error loading job details:', err)
  }
})

// Function to safely escape HTML for JSON display
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Function to apply syntax highlighting to JSON
function applyJsonHighlighting() {
  document.querySelectorAll('.json-viewer code').forEach((block) => {
    try {
      const rawContent = block.textContent || ''
      const obj = JSON.parse(rawContent)

      // Format the JSON with proper styling
      const highlighted = syntaxHighlight(obj)
      block.innerHTML = highlighted
    }
    catch (e) {
      console.error('Error highlighting JSON:', e)
      // If parsing fails, keep the original content
    }
  })
}

// Function to convert JSON to syntax highlighted HTML
function syntaxHighlight(obj: any): string {
  // Convert to string with proper formatting
  const json = JSON.stringify(obj, null, 2)

  // Escape HTML characters
  const escaped = escapeHtml(json)

  // Apply syntax highlighting with custom rules:
  // 1. First handle date-like strings (pink)
  // 2. Then handle keys (blue)
  // 3. Then handle regular strings (green)
  // 4. Then handle booleans (blue)

  return escaped
    // Handle date strings first (YYYY-MM-DD HH:MM:SS format)
    .replace(/"(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})"/g, '"<span class="date">$1</span>"')
    // Handle date strings in ISO format or with just time
    .replace(/"(\d{4}-\d{2}-\d{2}(?:T|\s)\d{2}:\d{2}(?::\d{2})?)"/g, '"<span class="date">$1</span>"')
    // Handle keys with their quotes
    .replace(/"([^"]+)":/g, '"<span class="key">$1</span>":')
    // Handle other string values
    .replace(/"([^"]+)"/g, '"<span class="string">$1</span>"')
    // Handle boolean values
    .replace(/\b(true|false)\b/g, '<span class="boolean">$1</span>')
    // Handle null values
    .replace(/\b(null)\b/g, '<span class="null">$1</span>')
    // Handle numbers
    .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="number">$1</span>')
}

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
      return 'bg-amber-100 text-amber-800'
    case JobStatus.ACTIVE:
      return 'bg-blue-100 text-blue-800'
    case JobStatus.COMPLETED:
      return 'bg-emerald-100 text-emerald-800'
    case JobStatus.FAILED:
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Format JSON for display with syntax highlighting
function formatJson(data: any): string {
  return JSON.stringify(data, null, 2)
}

// Mock actions
function cloneJob() {
  showCloneConfirm.value = false
  // Implementation would connect to backend API
}

function deleteJob() {
  showDeleteConfirm.value = false
  // Implementation would connect to backend API
  router.push('/jobs')
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

    <div v-else-if="job" class="flex flex-col lg:flex-row gap-6">
      <!-- Main content area (job details + data + result) -->
      <div class="lg:flex-grow lg:w-3/4">
        <!-- Job Header Card -->
        <div class="card p-6 mb-6 rounded-lg bg-white shadow">
          <div class="flex flex-col sm:flex-row justify-between sm:items-start">
            <div>
              <h3 class="text-xl font-semibold mb-1">
                {{ job.name }}
              </h3>
              <p class="text-gray-500 text-sm">
                ID: <span class="font-mono">{{ job.id }}</span>
              </p>
            </div>
            <div
              class="mt-2 sm:mt-0 px-3 py-1 inline-flex text-sm font-medium rounded-full"
              :class="getStatusClass(job.status)"
            >
              {{ job.status }}
            </div>
          </div>
        </div>

        <!-- Job Details Grid -->
        <div class="card p-6 mb-6 rounded-lg bg-white shadow">
          <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
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
                class="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <!-- Job Data Card -->
        <div class="card mb-6 rounded-lg bg-white shadow">
          <div class="p-5 flex items-center">
            <span class="i-carbon-data-base text-indigo-600 mr-3 text-xl" />
            <h3 class="text-lg font-medium text-gray-900">
              Job Data
            </h3>
          </div>
          <pre class="json-viewer rounded-b-lg"><code>{{ formatJson(job.data) }}</code></pre>
        </div>

        <!-- Result Card -->
        <div v-if="job.result" class="card mb-6 rounded-lg bg-white shadow">
          <div class="p-5 flex items-center">
            <span class="i-carbon-data-view-alt text-indigo-600 mr-3 text-xl" />
            <h3 class="text-lg font-medium text-gray-900">
              Result
            </h3>
          </div>
          <pre class="json-viewer rounded-b-lg"><code>{{ formatJson(job.result) }}</code></pre>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="lg:w-1/4 lg:min-w-[280px]">
        <!-- Actions Card -->
        <div class="card p-6 rounded-lg bg-white shadow sticky top-6">
          <div class="flex items-center mb-4">
            <span class="i-carbon-task text-indigo-600 mr-2 text-xl" />
            <h3 class="text-lg font-semibold">
              Actions
            </h3>
          </div>

          <div class="space-y-3">
            <button
              class="btn btn-outline w-full flex justify-center items-center"
              @click="showCloneConfirm = true"
            >
              <span class="i-carbon-copy mr-2" />
              Clone Job
            </button>
            <button
              class="btn btn-danger w-full flex justify-center items-center"
              @click="showDeleteConfirm = true"
            >
              <span class="i-carbon-trash-can mr-2" />
              Delete Job
            </button>
          </div>

          <!-- Job History Section -->
          <div class="mt-8">
            <h4 class="text-sm font-semibold mb-4 text-gray-700">
              Job History
            </h4>
            <div class="space-y-4">
              <div class="flex items-start gap-3 text-sm">
                <div class="w-3 h-3 rounded-full bg-emerald-500 mt-1.5" />
                <div>
                  <p class="font-medium">
                    Job Completed
                  </p>
                  <p class="text-gray-500 mt-0.5">
                    {{ job.updated }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3 text-sm">
                <div class="w-3 h-3 rounded-full bg-blue-500 mt-1.5" />
                <div>
                  <p class="font-medium">
                    Processing Started
                  </p>
                  <p class="text-gray-500 mt-0.5">
                    {{ job.created }}
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-3 text-sm">
                <div class="w-3 h-3 rounded-full bg-amber-500 mt-1.5" />
                <div>
                  <p class="font-medium">
                    Job Created
                  </p>
                  <p class="text-gray-500 mt-0.5">
                    {{ job.created }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation dialogs -->
    <div v-if="showCloneConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">
          Clone Job
        </h3>
        <p class="mb-6">
          Are you sure you want to clone this job? A new job with the same parameters will be created.
        </p>
        <div class="flex justify-end space-x-3">
          <button class="btn btn-outline" @click="showCloneConfirm = false">
            Cancel
          </button>
          <button class="btn btn-primary" @click="cloneJob">
            Clone Job
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h3 class="text-lg font-bold mb-4">
          Delete Job
        </h3>
        <p class="mb-6">
          Are you sure you want to delete this job? This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-3">
          <button class="btn btn-outline" @click="showDeleteConfirm = false">
            Cancel
          </button>
          <button class="btn btn-danger" @click="deleteJob">
            Delete Job
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.json-viewer {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
  font-size: 13px;
  line-height: 1.5;
  background-color: #0f172a; /* Dark navy background */
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 0 0 0.5rem 0.5rem;
  overflow-x: auto;
  max-height: 80vh;
}

/* JSON Syntax Highlighting - colors from screenshot */
.json-viewer :deep(.string) { color: #a3e635; } /* Green for regular strings */
.json-viewer :deep(.key) { color: #38bdf8; } /* Blue for keys */
.json-viewer :deep(.date) { color: #ec4899; } /* Pink/magenta for dates */
.json-viewer :deep(.boolean) { color: #60a5fa; } /* Blue for booleans */
.json-viewer :deep(.null) { color: #f43f5e; } /* Red for null */
.json-viewer :deep(.number) { color: #f472b6; } /* Pink for numbers */

/* Apply syntax highlighting with CSS */
.json-viewer code {
  white-space: pre-wrap;
}
</style>
