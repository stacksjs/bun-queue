<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  selected: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'change', range: string): void
}>()

const timeRanges = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
]

function handleChange(range: string) {
  emit('change', range)
}
</script>

<template>
  <div class="flex items-center space-x-2">
    <span class="text-sm text-gray-600">Time Range:</span>
    <div class="flex space-x-1">
      <button
        v-for="range in timeRanges"
        :key="range.value"
        class="px-3 py-1 text-sm rounded-lg transition-colors duration-200" :class="[
          range.value === selected
            ? 'bg-primary text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        ]"
        @click="handleChange(range.value)"
      >
        {{ range.label }}
      </button>
    </div>
  </div>
</template>
