<script setup lang="ts">
import { JobStatus } from '../types/job'

defineProps<{
  selected: string | null
}>()

const emit = defineEmits<{
  (e: 'statusChange', status: string | null): void
}>()

const statuses = [
  { value: JobStatus.WAITING, label: 'Waiting', color: 'badge-warning' },
  { value: JobStatus.ACTIVE, label: 'Active', color: 'badge-info' },
  { value: JobStatus.COMPLETED, label: 'Completed', color: 'badge-success' },
  { value: JobStatus.FAILED, label: 'Failed', color: 'badge-danger' },
]

function selectStatus(status: string | null) {
  emit('statusChange', status)
}
</script>

<template>
  <div class="flex items-center space-x-2">
    <span class="text-gray-600 font-medium">Filter:</span>
    <button
      class="px-3 py-1 rounded-lg text-sm border"
      :class="selected === null ? 'bg-gray-100 border-gray-400' : 'border-gray-300'"
      @click="selectStatus(null)"
    >
      All
    </button>
    <button
      v-for="status in statuses"
      :key="status.value"
      class="px-3 py-1 rounded-lg text-sm border"
      :class="[
        selected === status.value ? 'bg-gray-100 border-gray-400' : 'border-gray-300',
        status.color,
      ]"
      @click="selectStatus(status.value)"
    >
      {{ status.label }}
    </button>
  </div>
</template>
