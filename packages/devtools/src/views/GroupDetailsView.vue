<script lang="ts" setup>
import type { Job } from '../types/job'
import type { JobGroup } from '../types/jobGroup'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQueueStore } from '../store/queueStore'

const route = useRoute()
const router = useRouter()
const queueStore = useQueueStore()
const groupId = computed(() => route.params.id as string)
const loading = ref(false)
const error = ref<string | null>(null)
const groupJobs = ref<Job[]>([])
const loadingJobs = ref(false)
const jobsError = ref<string | null>(null)

const group = computed<JobGroup | undefined>(() => {
  return queueStore.jobGroups.find(g => g.id === groupId.value)
})

async function fetchGroup() {
  loading.value = true
  error.value = null

  try {
    await queueStore.fetchJobGroups()
    if (!queueStore.jobGroups.some(g => g.id === groupId.value)) {
      router.push('/groups')
      error.value = 'Group not found'
    }
  }
  catch (err) {
    error.value = 'Failed to load group details'
    console.error(err)
  }
  finally {
    loading.value = false
  }
}

async function fetchGroupJobs() {
  if (!groupId.value)
    return

  loadingJobs.value = true
  jobsError.value = null

  try {
    // In a real app, we would fetch jobs for this specific group
    // For now, we'll use a filtered subset of all jobs
    await queueStore.fetchJobs()

    // Mock: Filter jobs that might belong to this group (by name pattern)
    const groupName = group.value?.name.toLowerCase() || ''
    groupJobs.value = queueStore.jobs.filter(job =>
      job.name.toLowerCase().includes(groupName.split(' ')[0]),
    )
  }
  catch (err) {
    jobsError.value = 'Failed to load jobs for this group'
    console.error(err)
  }
  finally {
    loadingJobs.value = false
  }
}

function refreshData() {
  fetchGroup()
  fetchGroupJobs()
}

onMounted(() => {
  refreshData()
})
</script>

<template>
  <div v-if="loading && !group" class="loading-container">
    <div class="loader" />
    <p>Loading group details...</p>
  </div>

  <div v-else-if="error" class="error-container">
    <span class="i-carbon-warning text-2xl text-amber-500" />
    <p>{{ error }}</p>
    <button class="retry-button" @click="refreshData">
      Try Again
    </button>
  </div>

  <div v-else-if="!group" class="error-container">
    <span class="i-carbon-warning text-2xl text-amber-500" />
    <p>Group not found</p>
    <router-link to="/groups" class="retry-button">
      Back to Groups
    </router-link>
  </div>

  <div v-else class="group-details">
    <div class="page-header">
      <div class="flex items-center">
        <router-link to="/groups" class="back-link">
          <span class="i-carbon-arrow-left" />
        </router-link>
        <h1 class="text-2xl font-bold">
          {{ group.name }}
        </h1>
      </div>
      <button
        class="refresh-button"
        :disabled="loading"
        @click="refreshData"
      >
        <span
          class="i-carbon-renew" :class="[
            loading ? 'animate-spin' : '',
          ]"
        />
        <span class="ml-2">Refresh</span>
      </button>
    </div>

    <div class="stats-cards">
      <div class="stat-card">
        <h3 class="stat-title">
          Total Jobs
        </h3>
        <p class="stat-value">
          {{ group.jobCount }}
        </p>
      </div>
      <div class="stat-card">
        <h3 class="stat-title">
          Active
        </h3>
        <p class="stat-value">
          {{ group.activeJobs }}
        </p>
      </div>
      <div class="stat-card">
        <h3 class="stat-title">
          Waiting
        </h3>
        <p class="stat-value">
          {{ group.waitingJobs }}
        </p>
      </div>
      <div class="stat-card">
        <h3 class="stat-title">
          Completed
        </h3>
        <p class="stat-value">
          {{ group.completedJobs }}
        </p>
      </div>
      <div class="stat-card">
        <h3 class="stat-title">
          Failed
        </h3>
        <p class="stat-value text-red-500">
          {{ group.failedJobs }}
        </p>
      </div>
    </div>

    <div class="group-metadata">
      <div class="metadata-item">
        <span class="metadata-label">Created</span>
        <span class="metadata-value">{{ group.createdAt }}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Updated</span>
        <span class="metadata-value">{{ group.updatedAt }}</span>
      </div>
    </div>

    <div class="jobs-section">
      <h2 class="text-xl font-semibold mb-4">
        Jobs in this Group
      </h2>

      <div v-if="jobsError" class="jobs-error">
        <p>{{ jobsError }}</p>
        <button class="text-sm text-indigo-600" @click="fetchGroupJobs">
          Retry
        </button>
      </div>

      <div v-else-if="loadingJobs" class="jobs-loading">
        <div class="loader" />
        <p>Loading jobs...</p>
      </div>

      <div v-else-if="!groupJobs.length" class="jobs-empty">
        <p>No jobs found in this group</p>
      </div>

      <div v-else class="jobs-table">
        <div class="jobs-table-header">
          <div class="job-name-col">
            Name
          </div>
          <div class="job-status-col">
            Status
          </div>
          <div class="job-updated-col">
            Updated
          </div>
          <div class="job-actions-col" />
        </div>

        <div
          v-for="job in groupJobs"
          :key="job.id"
          class="jobs-table-row"
        >
          <div class="job-name-col">
            {{ job.name }}
          </div>
          <div class="job-status-col">
            <span
              class="status-badge"
              :class="{
                'status-badge-active': job.status === 'active',
                'status-badge-completed': job.status === 'completed',
                'status-badge-failed': job.status === 'failed',
                'status-badge-waiting': job.status === 'waiting',
              }"
            >{{ job.status }}</span>
          </div>
          <div class="job-updated-col">
            {{ job.updated }}
          </div>
          <div class="job-actions-col">
            <router-link :to="`/jobs/${job.id}`" class="view-job-link">
              View
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-details {
  padding-bottom: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background-color: #f3f4f6;
  color: #374151;
  margin-right: 0.75rem;
  transition: background-color 0.2s;
}

.back-link:hover {
  background-color: #e5e7eb;
}

.refresh-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #4f46e5;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.refresh-button:hover {
  background-color: #4338ca;
}

.refresh-button:disabled {
  background-color: #a5b4fc;
  cursor: not-allowed;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  text-align: center;
}

.loader {
  border: 3px solid #f3f4f6;
  border-top: 3px solid #4f46e5;
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  background-color: #fff2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 2rem;
  margin: 2rem 0;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #4f46e5;
  color: white;
  border-radius: 0.375rem;
  font-weight: 500;
  display: inline-block;
  text-decoration: none;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
  text-align: center;
}

.stat-title {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.group-metadata {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.metadata-item {
  display: flex;
  flex-direction: column;
}

.metadata-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.metadata-value {
  font-size: 0.875rem;
  color: #374151;
}

.jobs-section {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.jobs-error, .jobs-loading, .jobs-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  text-align: center;
  color: #6b7280;
}

.jobs-table {
  width: 100%;
  border-collapse: collapse;
}

.jobs-table-header {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 80px;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
  color: #4b5563;
  font-size: 0.875rem;
}

.jobs-table-row {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 80px;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.jobs-table-row:hover {
  background-color: #f9fafb;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge-active {
  background-color: #dcfce7;
  color: #15803d;
}

.status-badge-completed {
  background-color: #e0f2fe;
  color: #0369a1;
}

.status-badge-failed {
  background-color: #fee2e2;
  color: #b91c1c;
}

.status-badge-waiting {
  background-color: #f3f4f6;
  color: #4b5563;
}

.view-job-link {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #eef2ff;
  color: #4f46e5;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
}

.view-job-link:hover {
  background-color: #e0e7ff;
}
</style>
