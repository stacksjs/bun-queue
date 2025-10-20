<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ErrorRateChart from '../components/ErrorRateChart.vue'
import JobLatencyChart from '../components/JobLatencyChart.vue'
import JobThroughputChart from '../components/JobThroughputChart.vue'
import MetricsTimeRange from '../components/MetricsTimeRange.vue'
import { useQueueStore } from '../store/queueStore'

const queueStore = useQueueStore()
const isLoading = ref(true)
const error = ref<string | null>(null)
const timeRange = ref('24h') // Default time range: 24 hours

onMounted(async () => {
  try {
    await fetchMetrics()
  }
  catch {
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
  catch {
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
      <h2 class="text-2xl font-medium text-gray-800">
        Performance Metrics
      </h2>
      <div class="flex items-center space-x-4">
        <MetricsTimeRange :selected="timeRange" @change="handleTimeRangeChange" />
        <button class="btn btn-primary flex items-center" @click="fetchMetrics">
          <span v-if="queueStore.isLoadingMetrics" class="loader mr-2" />
          <span v-else class="i-carbon-refresh mr-2" />
          {{ queueStore.isLoadingMetrics ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading && queueStore.metrics.throughput.length === 0" class="card p-8 text-center bg-white rounded-lg shadow-sm">
      <div class="flex justify-center items-center space-x-3">
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-5 h-5 rounded-full bg-indigo-600 animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600 font-medium">
        Loading metrics...
      </p>
    </div>

    <div v-else-if="error" class="card bg-red-50 border border-red-200 text-red-600 p-8 text-center rounded-lg shadow-sm">
      <span class="i-carbon-warning-alt text-4xl text-red-500 mb-3" />
      <p class="font-medium">
        {{ error }}
      </p>
      <button class="btn btn-primary mt-5 px-6 py-2.5" @click="fetchMetrics">
        <span class="i-carbon-restart mr-2" />
        Retry
      </button>
    </div>

    <div v-else class="grid grid-cols-1 gap-6">
      <div class="card p-6 bg-white rounded-lg shadow-sm">
        <h3 class="text-lg font-medium mb-4 text-gray-800">
          Job Throughput
        </h3>
        <JobThroughputChart
          :data="queueStore.metrics.throughput"
          :labels="queueStore.metrics.timestamps"
        />
      </div>

      <div class="card p-6 bg-white rounded-lg shadow-sm">
        <h3 class="text-lg font-medium mb-4 text-gray-800">
          Job Latency (ms)
        </h3>
        <JobLatencyChart
          :data="queueStore.metrics.latency"
          :labels="queueStore.metrics.timestamps"
        />
      </div>

      <div class="card p-6 bg-white rounded-lg shadow-sm">
        <h3 class="text-lg font-medium mb-4 text-gray-800">
          Error Rate (%)
        </h3>
        <ErrorRateChart
          :data="queueStore.metrics.errorRate"
          :labels="queueStore.metrics.timestamps"
        />
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
