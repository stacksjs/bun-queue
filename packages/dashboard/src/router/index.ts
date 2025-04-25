import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
    },
    {
      path: '/queues',
      name: 'queues',
      component: () => import('../views/QueuesView.vue'),
    },
    {
      path: '/queues/:id',
      name: 'queue-details',
      component: () => import('../views/QueueDetailsView.vue'),
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: () => import('../views/JobsView.vue'),
    },
    {
      path: '/jobs/:id',
      name: 'job-details',
      component: () => import('../views/JobDetailsView.vue'),
    },
    {
      path: '/dependencies',
      name: 'dependencies',
      component: () => import('../views/JobDependenciesView.vue'),
    },
  ],
})

export default router
