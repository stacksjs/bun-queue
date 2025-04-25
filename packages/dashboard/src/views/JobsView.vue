<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import JobsList from '../components/JobsList.vue'
import JobStatusFilter from '../components/JobStatusFilter.vue'
import { useQueueStore } from '../store/queueStore'

const queueStore = useQueueStore()
const isLoading = ref(true)
const error = ref<string | null>(null)
const selectedStatus = ref<string | null>(null)
const searchQuery = ref('')

// Filter jobs based on selected status and search query
const filteredJobs = computed(() => {
  let filtered = queueStore.jobs

  if (selectedStatus.value) {
    filtered = filtered.filter(job => job.status === selectedStatus.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(job =>
      job.id.toLowerCase().includes(query)
      || job.name.toLowerCase().includes(query),
    )
  }

  return filtered
})

onMounted(async () => {
  try {
    await queueStore.fetchJobs()
    isLoading.value = false
  }
  catch (err) {
    error.value = 'Failed to load jobs'
    isLoading.value = false
  }
})

function handleStatusChange(status: string | null) {
  selectedStatus.value = status
}

async function refreshJobs() {
  isLoading.value = true
  error.value = null

  try {
    await queueStore.fetchJobs()
    isLoading.value = false
  }
  catch (err) {
    error.value = 'Failed to refresh jobs'
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">
        Jobs
      </h2>
      <button class="btn btn-primary" @click="refreshJobs">
        Refresh
      </button>
    </div>

    <div class="card mb-6">
      <div class="flex flex-col md:flex-row md:items-center gap-4 p-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search jobs by ID or name..."
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
        </div>
        <JobStatusFilter :selected="selectedStatus" @status-change="handleStatusChange" />
      </div>
    </div>

    <div v-if="isLoading" class="card p-8 text-center">
      <div class="flex justify-center items-center space-x-2">
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600">
        Loading jobs...
      </p>
    </div>

    <div v-else-if="error" class="card bg-danger/10 text-danger p-8 text-center">
      <p>{{ error }}</p>
      <button class="btn btn-primary mt-4" @click="refreshJobs">
        Retry
      </button>
    </div>

    <div v-else>
      <JobsList :jobs="filteredJobs" />
    </div>
  </div>
</template>
