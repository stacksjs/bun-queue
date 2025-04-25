<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: number
  icon?: string
  color?: string
}

const props = defineProps<Props>()

const iconClass = computed(() => {
  switch (props.icon) {
    case 'queue':
      return 'i-carbon-service-desk'
    case 'waiting':
      return 'i-carbon-time'
    case 'active':
      return 'i-carbon-play-filled'
    case 'completed':
      return 'i-carbon-checkmark'
    case 'failed':
      return 'i-carbon-close'
    default:
      return 'i-carbon-document'
  }
})

const colorClass = computed(() => {
  switch (props.color) {
    case 'primary':
      return 'bg-primary text-white'
    case 'secondary':
      return 'bg-secondary text-white'
    case 'success':
      return 'bg-success text-white'
    case 'danger':
      return 'bg-danger text-white'
    case 'warning':
      return 'bg-warning text-white'
    case 'info':
      return 'bg-info text-white'
    default:
      return 'bg-gray-100 text-gray-800'
  }
})

const formattedValue = computed(() => {
  return props.value.toLocaleString()
})
</script>

<template>
  <div class="card">
    <div class="flex items-center p-4">
      <div class="rounded-full p-3 mr-4" :class="[colorClass]">
        <div class="text-xl" :class="[iconClass]" />
      </div>
      <div>
        <h4 class="text-sm font-medium text-gray-500">
          {{ title }}
        </h4>
        <p class="text-2xl font-semibold">
          {{ formattedValue }}
        </p>
      </div>
    </div>
  </div>
</template>
