import type { BunpressConfig } from 'bunpress'

const config: BunpressConfig = {
  name: 'bun-queue',
  description: 'A Redis-backed job queue built for Bun, inspired by Laravel and BullMQ.',
  url: 'https://bun-queue.stacksjs.org',

  theme: {
    primaryColor: '#EF4444',
  },

  nav: [
    { text: 'Guide', link: '/guide/getting-started' },
    { text: 'API', link: '/api' },
    { text: 'GitHub', link: 'https://github.com/stacksjs/bun-queue' },
  ],

  sidebar: [
    {
      text: 'Introduction',
      items: [
        { text: 'What is bun-queue?', link: '/index' },
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Installation', link: '/install' },
        { text: 'Configuration', link: '/configuration' },
      ],
    },
    {
      text: 'Guide',
      items: [
        { text: 'Creating Jobs', link: '/guide/jobs' },
        { text: 'Workers', link: '/guide/workers' },
        { text: 'Failed Jobs', link: '/guide/failed' },
        { text: 'Cron Jobs', link: '/guide/cron' },
      ],
    },
    {
      text: 'Features',
      items: [
        { text: 'Priority Queues', link: '/priority-queues' },
        { text: 'Rate Limiting', link: '/rate-limiting' },
        { text: 'Dead Letter Queues', link: '/dead-letter-queues' },
        { text: 'Distributed Locks', link: '/distributed-locks' },
      ],
    },
    {
      text: 'Advanced',
      items: [
        { text: 'Middleware', link: '/advanced/middleware' },
        { text: 'Batching', link: '/advanced/batching' },
        { text: 'Horizontal Scaling', link: '/advanced/scaling' },
        { text: 'Monitoring', link: '/advanced/monitoring' },
      ],
    },
    {
      text: 'API Reference',
      items: [
        { text: 'Queue', link: '/api/queue' },
        { text: 'Job', link: '/api/job' },
        { text: 'Worker', link: '/api/worker' },
        { text: 'Types', link: '/api/types' },
      ],
    },
  ],

  head: [
    ['meta', { name: 'author', content: 'Stacks.js' }],
    ['meta', { name: 'keywords', content: 'bun, queue, job queue, redis, worker, cron, typescript' }],
  ],

  socialLinks: [
    { icon: 'github', link: 'https://github.com/stacksjs/bun-queue' },
    { icon: 'discord', link: 'https://discord.gg/stacksjs' },
    { icon: 'twitter', link: 'https://twitter.com/stacksjs' },
  ],
}

export default config
