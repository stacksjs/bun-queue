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
import { computed, ref } from 'vue'
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
        label: 'Jobs/Hour',
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: '#4f46e5',
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
      mode: 'index' as const,
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Jobs per hour',
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
