<script setup lang="ts">
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { format, parseISO } from 'date-fns'
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'

const props = defineProps<{
  data: ChartData[]
}>()

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
)

interface ChartData {
  time: string
  value: number
}

function formatTime(time: string): string {
  const date = parseISO(time)
  return format(date, 'HH:mm')
}

const chartData = computed(() => {
  const labels = props.data.map(item => formatTime(item.time))
  const values = props.data.map(item => item.value)

  return {
    labels,
    datasets: [
      {
        label: 'Average Latency (ms)',
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        data: values,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          return `${context.raw} ms`
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Milliseconds',
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
}
</script>

<template>
  <div class="h-80">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
