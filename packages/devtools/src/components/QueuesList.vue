<script setup lang="ts">
interface Queue {
  id: string
  name: string
  status: string
  jobCount: number
  pendingJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
}

defineProps<{
  queues: Queue[]
}>()
</script>

<template>
  <div>
    <div v-if="!queues.length" class="card p-8 text-center text-gray-500">
      <span class="i-carbon-list-boxes text-4xl block mx-auto mb-2 opacity-50" />
      <p>No queues found</p>
    </div>

    <div v-else class="grid gap-4">
      <div v-for="queue in queues" :key="queue.id" class="card p-4">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold">
              {{ queue.name }}
            </h3>
            <p class="text-sm text-gray-500">
              ID: {{ queue.id }}
            </p>
          </div>
          <div
            class="badge" :class="{
              'badge-success': queue.status === 'active',
              'badge-warning': queue.status === 'paused',
              'badge-danger': queue.status === 'stopped',
            }"
          >
            {{ queue.status }}
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div class="p-3 bg-gray-50 rounded-lg">
            <div class="text-xs text-gray-500">
              Total Jobs
            </div>
            <div class="text-xl font-semibold">
              {{ queue.jobCount }}
            </div>
          </div>
          <div class="p-3 bg-amber-50 rounded-lg">
            <div class="text-xs text-amber-600">
              Pending Jobs
            </div>
            <div class="text-xl font-semibold text-amber-600">
              {{ queue.pendingJobs }}
            </div>
          </div>
          <div class="p-3 bg-blue-50 rounded-lg">
            <div class="text-xs text-blue-600">
              Active Jobs
            </div>
            <div class="text-xl font-semibold text-blue-600">
              {{ queue.activeJobs }}
            </div>
          </div>
          <div class="p-3 bg-emerald-50 rounded-lg">
            <div class="text-xs text-emerald-600">
              Completed Jobs
            </div>
            <div class="text-xl font-semibold text-emerald-600">
              {{ queue.completedJobs }}
            </div>
          </div>
        </div>

        <div class="mt-4 flex justify-end space-x-2">
          <router-link :to="`/queues/${queue.id}`" class="btn btn-secondary">
            View Details
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
