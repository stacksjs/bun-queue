<script setup lang="ts">
import { useQueueStore } from '@/store/queueStore'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { computed, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const queueStore = useQueueStore()

const chartData = computed(() => {
  return {
    labels: ['Waiting', 'Active', 'Completed', 'Failed'],
    datasets: [
      {
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
        data: [
          queueStore.stats.waitingJobs,
          queueStore.stats.activeJobs,
          queueStore.stats.completedJobs,
          queueStore.stats.failedJobs,
        ],
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const label = context.label || ''
          const value = context.raw || 0
          const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0)
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0
          return `${label}: ${value} (${percentage}%)`
        },
      },
    },
  },
}
</script>

<template>
  <div class="h-64">
    <Doughnut :data="chartData" :options="chartOptions" />
  </div>
</template>
