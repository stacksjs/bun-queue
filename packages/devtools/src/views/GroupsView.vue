<script lang="ts" setup>
import type { JobGroup } from '../types/jobGroup'
import { computed, onMounted, ref } from 'vue'
import { useQueueStore } from '../store/queueStore'

const queueStore = useQueueStore()
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')

const groups = computed<JobGroup[]>(() => {
  return queueStore.jobGroups
})

const filteredGroups = computed(() => {
  if (!searchQuery.value)
    return groups.value
  const query = searchQuery.value.toLowerCase()
  return groups.value.filter((group: JobGroup) =>
    group.name.toLowerCase().includes(query),
  )
})

async function fetchGroups() {
  loading.value = true
  error.value = null

  try {
    await queueStore.fetchJobGroups()
  }
  catch (err) {
    error.value = 'Failed to load job groups'
    console.error(err)
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchGroups()
})

function refreshData() {
  fetchGroups()
}
</script>

<template>
  <div class="groups-view">
    <div class="page-header">
      <h1 class="text-2xl font-bold">
        Job Groups
      </h1>
      <div class="flex items-center gap-4">
        <div class="search-box">
          <span class="i-carbon-search text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search groups..."
            class="search-input"
          >
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
    </div>

    <div v-if="error" class="error-container">
      <span class="i-carbon-warning text-2xl text-amber-500" />
      <p>{{ error }}</p>
      <button class="retry-button" @click="refreshData">
        Try Again
      </button>
    </div>

    <div v-else-if="loading && !groups.length" class="loading-container">
      <div class="loader" />
      <p>Loading job groups...</p>
    </div>

    <div v-else-if="!filteredGroups.length" class="empty-state">
      <span class="i-carbon-folder text-5xl text-gray-400" />
      <p v-if="searchQuery" class="mt-4">
        No groups matching "{{ searchQuery }}"
      </p>
      <p v-else class="mt-4">
        No job groups available
      </p>
    </div>

    <div v-else class="groups-grid">
      <div
        v-for="group in filteredGroups"
        :key="group.id"
        class="group-card"
      >
        <div class="group-header">
          <h3 class="group-name">
            {{ group.name }}
          </h3>
          <span class="group-job-count">{{ group.jobCount }} jobs</span>
        </div>
        <div class="group-stats">
          <div class="stat-item">
            <span class="stat-label">Active:</span>
            <span class="stat-value">{{ group.activeJobs }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Completed:</span>
            <span class="stat-value">{{ group.completedJobs }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Failed:</span>
            <span class="stat-value">{{ group.failedJobs }}</span>
          </div>
        </div>
        <div class="group-actions">
          <router-link :to="`/groups/${group.id}`" class="view-details-button">
            View Details
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.groups-view {
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 0.375rem;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.75rem;
  width: 16rem;
}

.search-input {
  border: none;
  outline: none;
  background: transparent;
  margin-left: 0.5rem;
  font-size: 0.875rem;
  width: 100%;
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

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 2rem;
  margin: 2rem 0;
  text-align: center;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #4f46e5;
  color: white;
  border-radius: 0.375rem;
  font-weight: 500;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
  color: #6b7280;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.group-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.group-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.group-name {
  font-weight: 600;
  font-size: 1.125rem;
  color: #1e293b;
}

.group-job-count {
  font-size: 0.875rem;
  color: #64748b;
  background-color: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
}

.group-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
}

.stat-value {
  font-weight: 600;
  color: #0f172a;
}

.group-actions {
  display: flex;
  justify-content: flex-end;
}

.view-details-button {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #eef2ff;
  color: #4f46e5;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s;
}

.view-details-button:hover {
  background-color: #dbeafe;
}
</style>
