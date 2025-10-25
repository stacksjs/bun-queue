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
      path: '/monitoring',
      name: 'monitoring',
      component: () => import('../views/MonitoringView.vue'),
    },
    {
      path: '/metrics',
      name: 'metrics',
      component: () => import('../views/MetricsView.vue'),
    },
    {
      path: '/batches',
      name: 'batches',
      component: () => import('../views/BatchesView.vue'),
    },
    {
      path: '/batches/:id',
      name: 'batch-details',
      component: () => import('../views/BatchDetailsView.vue'),
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
      path: '/groups',
      name: 'groups',
      component: () => import('../views/GroupsView.vue'),
    },
    {
      path: '/groups/:id',
      name: 'group-details',
      component: () => import('../views/GroupDetailsView.vue'),
    },
    {
      path: '/dependencies',
      name: 'dependencies',
      component: () => import('../views/JobDependenciesView.vue'),
    },
  ],
})

export default router
