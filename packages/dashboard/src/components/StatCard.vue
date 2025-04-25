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
      return 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
    case 'secondary':
      return 'bg-gradient-to-br from-slate-500 to-slate-600 text-white'
    case 'success':
      return 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
    case 'danger':
      return 'bg-gradient-to-br from-red-500 to-red-600 text-white'
    case 'warning':
      return 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
    case 'info':
      return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
    default:
      return 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800'
  }
})

const formattedValue = computed(() => {
  return props.value.toLocaleString()
})
</script>

<template>
  <div class="card transition-all duration-300 hover:shadow-lg hover:transform hover:translate-y-[-2px]">
    <div class="flex items-center p-5">
      <div class="rounded-full p-3.5 mr-5 shadow-md" :class="[colorClass]">
        <div class="text-2xl" :class="[iconClass]" />
      </div>
      <div>
        <h4 class="text-sm font-medium text-gray-500">
          {{ title }}
        </h4>
        <p class="text-3xl font-bold mt-1">
          {{ formattedValue }}
        </p>
      </div>
    </div>
  </div>
</template>
