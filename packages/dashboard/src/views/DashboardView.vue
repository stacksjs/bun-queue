<script setup lang="ts">
import JobsProcessedChart from '@/components/JobsProcessedChart.vue'
import QueueStatusChart from '@/components/QueueStatusChart.vue'
import StatCard from '@/components/StatCard.vue'
import { useQueueStore } from '@/store/queueStore'
import { onMounted, ref } from 'vue'

const queueStore = useQueueStore()
const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await queueStore.fetchQueueStats()
    isLoading.value = false
  }
  catch (err) {
    error.value = 'Failed to load dashboard data'
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <div class="flex items-center mb-6">
      <span class="i-carbon-dashboard text-2xl text-indigo-600 mr-3" />
      <h2 class="text-2xl font-bold text-gray-800">
        Dashboard Overview
      </h2>
    </div>

    <div v-if="isLoading" class="card p-8 text-center bg-white rounded-xl shadow-md">
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
      <button class="btn btn-primary mt-5 px-6 py-2.5" @click="queueStore.fetchQueueStats">
        <span class="i-carbon-restart mr-2" />
        Retry
      </button>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Active Queues"
          :value="queueStore.stats.activeQueues"
          icon="queue"
          color="primary"
        />
        <StatCard
          title="Waiting Jobs"
          :value="queueStore.stats.waitingJobs"
          icon="waiting"
          color="warning"
        />
        <StatCard
          title="Active Jobs"
          :value="queueStore.stats.activeJobs"
          icon="active"
          color="info"
        />
        <StatCard
          title="Completed Jobs"
          :value="queueStore.stats.completedJobs"
          icon="completed"
          color="success"
        />
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div class="card p-5 rounded-xl shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center mb-4">
            <span class="i-carbon-chart-pie text-xl text-indigo-600 mr-2" />
            <h3 class="text-lg font-medium text-gray-800">
              Queue Status
            </h3>
          </div>
          <div class="p-2">
            <QueueStatusChart />
          </div>
        </div>
        <div class="card p-5 rounded-xl shadow hover:shadow-lg transition-shadow">
          <div class="flex items-center mb-4">
            <span class="i-carbon-chart-line text-xl text-indigo-600 mr-2" />
            <h3 class="text-lg font-medium text-gray-800">
              Jobs Processed (Last 24h)
            </h3>
          </div>
          <div class="p-2">
            <JobsProcessedChart />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
