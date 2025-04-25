<script setup lang="ts">
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
import { format, parseISO } from 'date-fns'
import { computed } from 'vue'
import { Line } from 'vue-chartjs'

const props = defineProps<{
  data: ChartData[]
}>()

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
        label: 'Error Rate (%)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#ef4444',
        tension: 0.4,
        fill: true,
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
          return `${context.raw}%`
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      suggestedMax: 10,
      title: {
        display: true,
        text: 'Error Rate (%)',
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
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
