import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/DashboardView.vue'),
  },
  {
    path: '/jobs',
    name: 'Jobs',
    component: () => import('@/views/JobsView.vue'),
  },
  {
    path: '/queues',
    name: 'Queues',
    component: () => import('@/views/QueuesView.vue'),
  },
  {
    path: '/metrics',
    name: 'Metrics',
    component: () => import('@/views/MetricsView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
