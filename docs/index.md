---
title: bun-queue - Redis-backed Job Queue for Bun
description: Fast, reliable, and type-safe job queue for Bun, inspired by Laravel and BullMQ.
layout: home

hero:
  name: "bun-queue"
  text: "Redis-backed Job Queue for Bun"
  tagline: "Fast, reliable, and type-safe job queue inspired by Laravel and BullMQ."
  image: /images/logo-white.png
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/stacksjs/bun-queue

features:
  - title: "Redis-backed"
    icon: "🔄"
    details: "Reliable job persistence with Redis for distributed processing."
  - title: "Priority Queues"
    icon: "⬆️"
    details: "Process jobs in priority order with multiple priority levels."
  - title: "Cron Jobs"
    icon: "⏰"
    details: "Schedule recurring jobs using standard cron expressions."
  - title: "Dead Letter Queues"
    icon: "📮"
    details: "Automatically handle permanently failed jobs."
  - title: "Rate Limiting"
    icon: "🚦"
    details: "Built-in rate limiting with key-based throttling."
  - title: "Horizontal Scaling"
    icon: "📈"
    details: "Scale across multiple instances with leader election."
---