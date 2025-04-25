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
    <h2 class="text-2xl font-bold mb-6">
      Dashboard Overview
    </h2>

    <div v-if="isLoading" class="card p-8 text-center">
      <div class="flex justify-center items-center space-x-2">
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600">
        Loading dashboard data...
      </p>
    </div>

    <div v-else-if="error" class="card bg-danger/10 text-danger p-8 text-center">
      <p>{{ error }}</p>
      <button class="btn btn-primary mt-4" @click="queueStore.fetchQueueStats">
        Retry
      </button>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-4">
          <h3 class="text-lg font-medium mb-4">
            Queue Status
          </h3>
          <QueueStatusChart />
        </div>
        <div class="card p-4">
          <h3 class="text-lg font-medium mb-4">
            Jobs Processed (Last 24h)
          </h3>
          <JobsProcessedChart />
        </div>
      </div>
    </div>
  </div>
</template>
