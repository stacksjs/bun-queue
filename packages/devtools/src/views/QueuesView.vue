<script setup lang="ts">
import { onMounted, ref } from 'vue'
import QueuesList from '../components/QueuesList.vue'
import { useQueueStore } from '../store/queueStore'

const queueStore = useQueueStore()
const isLoading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await queueStore.fetchQueues()
    isLoading.value = false
  }
  catch (err) {
    error.value = 'Failed to load queues'
    isLoading.value = false
  }
})

async function refreshQueues() {
  isLoading.value = true
  error.value = null

  try {
    await queueStore.fetchQueues()
    isLoading.value = false
  }
  catch (err) {
    error.value = 'Failed to refresh queues'
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">
        Queues
      </h2>
      <button class="btn btn-primary" @click="refreshQueues">
        Refresh
      </button>
    </div>

    <div v-if="isLoading" class="card p-8 text-center">
      <div class="flex justify-center items-center space-x-2">
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.2s" />
        <div class="w-4 h-4 rounded-full bg-primary animate-pulse" style="animation-delay: 0.4s" />
      </div>
      <p class="mt-4 text-gray-600">
        Loading queues...
      </p>
    </div>

    <div v-else-if="error" class="card bg-danger/10 text-danger p-8 text-center">
      <p>{{ error }}</p>
      <button class="btn btn-primary mt-4" @click="refreshQueues">
        Retry
      </button>
    </div>

    <div v-else>
      <QueuesList :queues="queueStore.queues" />
    </div>
  </div>
</template>
