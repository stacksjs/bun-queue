<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const currentYear = computed(() => new Date().getFullYear())
const route = useRoute()
const isMobileMenuOpen = ref(false)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <header class="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-4 sticky top-0 z-10 shadow-md">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <span class="i-carbon-queue text-2xl mr-2" />
            <h1 class="text-2xl font-bold">
              Bun Queue Dashboard
            </h1>
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:block">
            <ul class="flex space-x-6">
              <li>
                <router-link
                  class="flex items-center py-2 px-3 rounded transition hover:bg-white/10"
                  :class="{ 'bg-white/20': route.path === '/' }"
                  to="/"
                >
                  <span class="i-carbon-home mr-2" />
                  Home
                </router-link>
              </li>
              <li>
                <router-link
                  class="flex items-center py-2 px-3 rounded transition hover:bg-white/10"
                  :class="{ 'bg-white/20': route.path === '/jobs' }"
                  to="/jobs"
                >
                  <span class="i-carbon-task mr-2" />
                  Jobs
                </router-link>
              </li>
              <li>
                <router-link
                  class="flex items-center py-2 px-3 rounded transition hover:bg-white/10"
                  :class="{ 'bg-white/20': route.path === '/queues' }"
                  to="/queues"
                >
                  <span class="i-carbon-list mr-2" />
                  Queues
                </router-link>
              </li>
              <li>
                <router-link
                  class="flex items-center py-2 px-3 rounded transition hover:bg-white/10"
                  :class="{ 'bg-white/20': route.path === '/metrics' }"
                  to="/metrics"
                >
                  <span class="i-carbon-chart-line mr-2" />
                  Metrics
                </router-link>
              </li>
            </ul>
          </nav>

          <!-- Mobile Menu Button -->
          <button class="md:hidden text-white" @click="toggleMobileMenu">
            <span class="i-carbon-menu text-2xl" />
          </button>
        </div>

        <!-- Mobile Navigation -->
        <div v-if="isMobileMenuOpen" class="mt-4 md:hidden">
          <nav>
            <ul class="flex flex-col space-y-2">
              <li>
                <router-link
                  class="flex items-center py-2 px-3 rounded transition hover:bg-white/10"
                  :class="{ 'bg-white/20': route.path === '/' }"
                  to="/"
                  @click="isMobileMenuOpen = false"
                >
                  <span class="i-carbon-home mr-2" />
                  Home
                </router-link>
              </li>
              <li>
                <router-link
                  class="flex items-center py-2 px-3 rounded transition hover:bg-white/10"
                  :class="{ 'bg-white/20': route.path === '/jobs' }"
                  to="/jobs"
                  @click="isMobileMenuOpen = false"
                >
                  <span class="i-carbon-task mr-2" />
                  Jobs
                </router-link>
              </li>
              <li>
                <router-link
                  class="flex items-center py-2 px-3 rounded transition hover:bg-white/10"
                  :class="{ 'bg-white/20': route.path === '/queues' }"
                  to="/queues"
                  @click="isMobileMenuOpen = false"
                >
                  <span class="i-carbon-list mr-2" />
                  Queues
                </router-link>
              </li>
              <li>
                <router-link
                  class="flex items-center py-2 px-3 rounded transition hover:bg-white/10"
                  :class="{ 'bg-white/20': route.path === '/metrics' }"
                  to="/metrics"
                  @click="isMobileMenuOpen = false"
                >
                  <span class="i-carbon-chart-line mr-2" />
                  Metrics
                </router-link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>

    <main class="container mx-auto p-6 flex-grow">
      <router-view />
    </main>

    <footer class="bg-gray-800 text-white py-4">
      <div class="container mx-auto px-4 text-center">
        <p>Bun Queue Dashboard &copy; {{ currentYear }}</p>
      </div>
    </footer>
  </div>
</template>
