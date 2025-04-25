import axios from 'axios'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { JobStatus } from '../types/job'

interface Queue {
  id: string
  name: string
  status: string
  jobCount: number
  pendingJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
}

interface Job {
  id: string
  name: string
  status: string
  queue: string
  created: string
  updated: string
  data?: Record<string, any>
}

interface QueueStats {
  activeQueues: number
  waitingJobs: number
  activeJobs: number
  completedJobs: number
  failedJobs: number
  processingRate: number // jobs per minute
}

export const useQueueStore = defineStore('queue', () => {
  // Data
  const queues = ref<Queue[]>([])
  const jobs = ref<Job[]>([])
  const stats = ref<QueueStats>({
    activeQueues: 0,
    waitingJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    processingRate: 0,
  })

  // Loading states
  const isLoadingQueues = ref(false)
  const isLoadingJobs = ref(false)
  const isLoadingStats = ref(false)
  const queuesFetchedAt = ref<Date | null>(null)
  const jobsFetchedAt = ref<Date | null>(null)
  const statsFetchedAt = ref<Date | null>(null)

  // Errors
  const queueError = ref<string | null>(null)
  const jobsError = ref<string | null>(null)
  const statsError = ref<string | null>(null)

  // Computed properties
  const hasQueues = computed(() => queues.value.length > 0)
  const hasJobs = computed(() => jobs.value.length > 0)
  const hasStats = computed(() => statsFetchedAt.value !== null)

  // Check if data needs refresh (older than 5 minutes)
  const needsRefresh = (lastFetchTime: Date | null) => {
    if (!lastFetchTime)
      return true
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    return lastFetchTime < fiveMinutesAgo
  }

  // Fetch only if needed or forced
  async function fetchQueues(forceRefresh = false) {
    if (!forceRefresh && hasQueues.value && !needsRefresh(queuesFetchedAt.value)) {
      return queues.value
    }

    isLoadingQueues.value = true
    queueError.value = null

    try {
      // In a real app, this would be an API call
      // const response = await axios.get('/api/queues')
      // queues.value = response.data

      // Mock data for demo
      await new Promise(resolve => setTimeout(resolve, 800))
      queues.value = [
        {
          id: 'queue_email',
          name: 'Email Queue',
          status: 'active',
          jobCount: 254,
          pendingJobs: 48,
          activeJobs: 6,
          completedJobs: 197,
          failedJobs: 3,
        },
        {
          id: 'queue_image',
          name: 'Image Processing',
          status: 'active',
          jobCount: 178,
          pendingJobs: 32,
          activeJobs: 8,
          completedJobs: 135,
          failedJobs: 3,
        },
        {
          id: 'queue_data',
          name: 'Data Import',
          status: 'paused',
          jobCount: 87,
          pendingJobs: 42,
          activeJobs: 0,
          completedJobs: 43,
          failedJobs: 2,
        },
        {
          id: 'queue_report',
          name: 'Report Generation',
          status: 'active',
          jobCount: 112,
          pendingJobs: 15,
          activeJobs: 2,
          completedJobs: 92,
          failedJobs: 3,
        },
        {
          id: 'queue_notification',
          name: 'Push Notifications',
          status: 'active',
          jobCount: 329,
          pendingJobs: 24,
          activeJobs: 5,
          completedJobs: 300,
          failedJobs: 0,
        },
        {
          id: 'queue_backup',
          name: 'Database Backup',
          status: 'active',
          jobCount: 42,
          pendingJobs: 0,
          activeJobs: 1,
          completedJobs: 41,
          failedJobs: 0,
        },
        {
          id: 'queue_analytics',
          name: 'Analytics Processing',
          status: 'stopped',
          jobCount: 56,
          pendingJobs: 56,
          activeJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
        },
      ]
      queuesFetchedAt.value = new Date()
      return queues.value
    }
    catch (error) {
      queueError.value = 'Failed to load queues'
      console.error('Error fetching queues:', error)
      throw error
    }
    finally {
      isLoadingQueues.value = false
    }
  }

  async function fetchJobs(forceRefresh = false) {
    if (!forceRefresh && hasJobs.value && !needsRefresh(jobsFetchedAt.value)) {
      return jobs.value
    }

    isLoadingJobs.value = true
    jobsError.value = null

    try {
      // In a real app, this would be an API call
      // const response = await axios.get('/api/jobs')
      // jobs.value = response.data

      // Mock data for demo
      await new Promise(resolve => setTimeout(resolve, 800))
      jobs.value = [
        {
          id: 'job_1a2b3c',
          name: 'Send Welcome Email',
          status: JobStatus.COMPLETED,
          queue: 'Email Queue',
          created: '2023-10-15 09:15:22',
          updated: '2023-10-15 09:15:45',
          data: {
            recipient: 'john.doe@example.com',
            template: 'welcome_template',
            sent: true,
            subject: 'Welcome to Our Platform',
            deliveryStatus: 'delivered',
            openedAt: '2023-10-15 10:22:15',
          },
        },
        {
          id: 'job_2b3c4d',
          name: 'Send Password Reset',
          status: JobStatus.ACTIVE,
          queue: 'Email Queue',
          created: '2023-10-15 11:42:10',
          updated: '2023-10-15 11:42:15',
          data: {
            recipient: 'sarah.smith@example.com',
            template: 'password_reset',
            sent: false,
          },
        },
        {
          id: 'job_3c4d5e',
          name: 'Process Profile Picture',
          status: JobStatus.ACTIVE,
          queue: 'Image Processing',
          created: '2023-10-15 10:30:00',
          updated: '2023-10-15 10:30:12',
          data: {
            user_id: 'user_789',
            file_size: '2.4MB',
            formats: ['jpg', 'webp', 'thumbnail'],
          },
        },
        {
          id: 'job_4d5e6f',
          name: 'Process Product Images',
          status: JobStatus.WAITING,
          queue: 'Image Processing',
          created: '2023-10-15 11:05:30',
          updated: '2023-10-15 11:05:30',
          data: {
            product_id: 'prod_456',
            image_count: 5,
            formats: ['jpg', 'webp', 'thumbnail'],
          },
        },
        {
          id: 'job_5e6f7g',
          name: 'Import Customer Data',
          status: JobStatus.WAITING,
          queue: 'Data Import',
          created: '2023-10-15 11:45:00',
          updated: '2023-10-15 11:45:00',
          data: {
            source: 'CSV Upload',
            records: 1250,
            file_name: 'customers_oct_2023.csv',
          },
        },
        {
          id: 'job_6f7g8h',
          name: 'Generate Monthly Report',
          status: JobStatus.FAILED,
          queue: 'Report Generation',
          created: '2023-10-14 23:00:00',
          updated: '2023-10-14 23:05:30',
          data: {
            report_type: 'financial',
            period: 'October 2023',
            error: 'Database connection timeout',
          },
        },
        {
          id: 'job_7g8h9i',
          name: 'Send Push Notification',
          status: JobStatus.COMPLETED,
          queue: 'Push Notifications',
          created: '2023-10-15 08:30:00',
          updated: '2023-10-15 08:30:05',
          data: {
            user_ids: ['user_123', 'user_456', 'user_789'],
            title: 'New Feature Available',
            body: 'Check out our latest update!',
          },
        },
        {
          id: 'job_8h9i0j',
          name: 'Daily Database Backup',
          status: JobStatus.ACTIVE,
          queue: 'Database Backup',
          created: '2023-10-15 02:00:00',
          updated: '2023-10-15 02:10:15',
          data: {
            database: 'production',
            size: '4.2GB',
            destination: 's3://backups/daily/',
          },
        },
        {
          id: 'job_9i0j1k',
          name: 'Process Analytics Data',
          status: JobStatus.WAITING,
          queue: 'Analytics Processing',
          created: '2023-10-15 12:00:00',
          updated: '2023-10-15 12:00:00',
          data: {
            source: 'web_traffic',
            period: 'last_24h',
            metrics: ['pageviews', 'sessions', 'conversions'],
          },
        },
        {
          id: 'job_0j1k2l',
          name: 'Send Weekly Newsletter',
          status: JobStatus.WAITING,
          queue: 'Email Queue',
          created: '2023-10-15 13:15:00',
          updated: '2023-10-15 13:15:00',
          data: {
            recipients_count: 4578,
            template: 'weekly_digest',
            scheduled: true,
          },
        },
        {
          id: 'job_1k2l3m',
          name: 'Optimize Product Images',
          status: JobStatus.COMPLETED,
          queue: 'Image Processing',
          created: '2023-10-14 15:30:00',
          updated: '2023-10-14 15:35:12',
          data: {
            product_ids: ['prod_123', 'prod_124', 'prod_125'],
            format: 'webp',
            compression: 'high',
          },
        },
        {
          id: 'job_2l3m4n',
          name: 'Generate Sales Report',
          status: JobStatus.COMPLETED,
          queue: 'Report Generation',
          created: '2023-10-14 10:00:00',
          updated: '2023-10-14 10:04:45',
          data: {
            report_type: 'sales',
            period: 'Q3 2023',
            format: 'pdf',
          },
        },
      ]
      jobsFetchedAt.value = new Date()
      return jobs.value
    }
    catch (error) {
      jobsError.value = 'Failed to load jobs'
      console.error('Error fetching jobs:', error)
      throw error
    }
    finally {
      isLoadingJobs.value = false
    }
  }

  async function fetchQueueStats(forceRefresh = false) {
    if (!forceRefresh && hasStats.value && !needsRefresh(statsFetchedAt.value)) {
      return stats.value
    }

    isLoadingStats.value = true
    statsError.value = null

    try {
      // In a real app, this would be an API call
      // const response = await axios.get('/api/stats')
      // stats.value = response.data

      // Mock data for demo
      await new Promise(resolve => setTimeout(resolve, 800))
      stats.value = {
        activeQueues: 5,
        waitingJobs: 217,
        activeJobs: 22,
        completedJobs: 808,
        failedJobs: 11,
        processingRate: 64,
      }
      statsFetchedAt.value = new Date()
      return stats.value
    }
    catch (error) {
      statsError.value = 'Failed to load statistics'
      console.error('Error fetching stats:', error)
      throw error
    }
    finally {
      isLoadingStats.value = false
    }
  }

  // Clear stored data (for logout, etc)
  function clearData() {
    queues.value = []
    jobs.value = []
    stats.value = {
      activeQueues: 0,
      waitingJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      failedJobs: 0,
      processingRate: 0,
    }
    queuesFetchedAt.value = null
    jobsFetchedAt.value = null
    statsFetchedAt.value = null
  }

  return {
    // Data
    queues,
    jobs,
    stats,

    // Loading states
    isLoadingQueues,
    isLoadingJobs,
    isLoadingStats,

    // Error states
    queueError,
    jobsError,
    statsError,

    // Status helpers
    hasQueues,
    hasJobs,
    hasStats,

    // Actions
    fetchQueues,
    fetchJobs,
    fetchQueueStats,
    clearData,
  }
})
