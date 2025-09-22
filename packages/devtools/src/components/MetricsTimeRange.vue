<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  selected: string
}>()

const emit = defineEmits<{
  (e: 'change', value: string): void
}>()

const timeRanges = [
  { value: '24h', label: '24 Hours' },
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
]

const selectedValue = ref(props.selected || '24h')

watch(selectedValue, (newValue) => {
  emit('change', newValue)
})

watch(() => props.selected, (newValue) => {
  if (newValue !== selectedValue.value) {
    selectedValue.value = newValue
  }
})
</script>

<template>
  <div class="time-range-selector">
    <div class="flex space-x-1 p-1 bg-gray-100 rounded-lg">
      <button
        v-for="range in timeRanges"
        :key="range.value"
        class="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
        :class="{
          'bg-white text-indigo-600 shadow': selectedValue === range.value,
          'text-gray-600 hover:text-gray-900': selectedValue !== range.value,
        }"
        @click="selectedValue = range.value"
      >
        {{ range.label }}
      </button>
    </div>
  </div>
</template>
