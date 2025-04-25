<script lang="ts" setup>
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<template>
  <div class="min-h-screen">
    <header class="bg-primary text-white py-4">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">
            Bun Queue Dashboard
          </h1>
          <nav>
            <ul class="flex space-x-4">
              <li>
                <router-link class="hover:text-white/80" to="/">
                  Home
                </router-link>
              </li>
              <li>
                <router-link class="hover:text-white/80" to="/jobs">
                  Jobs
                </router-link>
              </li>
              <li>
                <router-link class="hover:text-white/80" to="/queues">
                  Queues
                </router-link>
              </li>
              <li>
                <router-link class="hover:text-white/80" to="/metrics">
                  Metrics
                </router-link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>

    <main class="container mx-auto p-4">
      <router-view />
    </main>

    <footer class="bg-gray-800 text-white py-4 mt-auto">
      <div class="container mx-auto px-4 text-center">
        <p>Bun Queue Dashboard &copy; {{ currentYear }}</p>
      </div>
    </footer>
  </div>
</template>
