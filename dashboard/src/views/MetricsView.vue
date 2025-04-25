<script setup lang="ts">
import ErrorRateChart from '@/components/ErrorRateChart.vue'
import JobLatencyChart from '@/components/JobLatencyChart.vue'
import JobThroughputChart from '@/components/JobThroughputChart.vue'
import MetricsTimeRange from '@/components/MetricsTimeRange.vue'
import { useQueueStore } from '@/store/queueStore'
import { onMounted, ref } from 'vue'

const queueStore = useQueueStore()
const isLoading = ref(true)
const error = ref<string | null>(null)
const timeRange = ref('24h') // Default time range: 24 hours

onMounted(async () => {
  try {
    await fetchMetrics()
  }
  catch (err) {
    error.value = 'Failed to load metrics'
    isLoading.value = false
  }
})

async function fetchMetrics() {
  isLoading.value = true
  error.value = null

  try {
    await queueStore.fetchMetrics(timeRange.value)
    isLoading.value = false
  }
  catch (err) {
    error.value = 'Failed to load metrics'
    isLoading.value = false
  }
}

function handleTimeRangeChange(range: string) {
  timeRange.value = range
  fetchMetrics()
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">
        Performance Metrics
      </h2>
      <div class="flex items-center space-x-4">
        <MetricsTimeRange :selected="timeRange" @change="handleTimeRangeChange" />
        <button class="btn btn-primary" @click="fetchMetrics">
          Refresh
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="card p-8 text-center">
      <div class="flex justify-center items-center space-x-2">
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600">
        Loading metrics...
      </p>
    </div>

    <div v-else-if="error" class="card bg-danger/10 text-danger p-8 text-center">
      <p>{{ error }}</p>
      <button class="btn btn-primary mt-4" @click="fetchMetrics">
        Retry
      </button>
    </div>

    <div v-else class="grid grid-cols-1 gap-6">
      <div class="card p-4">
        <h3 class="text-lg font-medium mb-4">
          Job Throughput
        </h3>
        <JobThroughputChart :data="queueStore.metrics.throughput" />
      </div>

      <div class="card p-4">
        <h3 class="text-lg font-medium mb-4">
          Job Latency (ms)
        </h3>
        <JobLatencyChart :data="queueStore.metrics.latency" />
      </div>

      <div class="card p-4">
        <h3 class="text-lg font-medium mb-4">
          Error Rate (%)
        </h3>
        <ErrorRateChart :data="queueStore.metrics.errorRate" />
      </div>
    </div>
  </div>
</template>
