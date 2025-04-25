<script setup lang="ts">
import { useQueueStore } from '@/store/queueStore'
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { format } from 'date-fns'
import { computed } from 'vue'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
)

const queueStore = useQueueStore()

const chartData = computed(() => {
  // Generate some mock data for now
  const labels = Array.from({ length: 24 }, (_, i) => {
    const date = new Date()
    date.setHours(date.getHours() - 23 + i)
    return format(date, 'HH:mm')
  })

  const completedData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 40) + 10)
  const failedData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 5))

  return {
    labels,
    datasets: [
      {
        label: 'Completed',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        data: completedData,
      },
      {
        label: 'Failed',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#ef4444',
        data: failedData,
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
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
}
</script>

<template>
  <div class="h-64">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
