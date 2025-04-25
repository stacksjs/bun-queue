<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isSidebarOpen = ref(true)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: 'i-carbon-dashboard' },
  { name: 'Monitoring', path: '/monitoring', icon: 'i-carbon-cloud-monitoring' },
  { name: 'Metrics', path: '/metrics', icon: 'i-carbon-chart-line' },
  { name: 'Groups', path: '/groups', icon: 'i-carbon-group' },
  { name: 'Batches', path: '/batches', icon: 'i-carbon-batch-job' },
  { name: 'Jobs', path: '/jobs', icon: 'i-carbon-time' },
]
</script>

<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside
      class="sidebar"
      :class="isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'"
    >
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="logo-icon">
            <span class="i-carbon-delivery text-indigo-600 text-2xl" />
          </div>
          <h1
            class="logo-text"
            :class="isSidebarOpen ? 'visible' : 'hidden'"
          >
            Bun Queue
          </h1>
        </div>
        <button
          class="sidebar-toggle"
          @click="toggleSidebar"
        >
          <span
            class="toggle-icon"
            :class="isSidebarOpen ? 'i-carbon-chevron-left' : 'i-carbon-chevron-right'"
          />
        </button>
      </div>

      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li v-for="item in navItems" :key="item.path" class="nav-item">
            <router-link
              :to="item.path"
              class="nav-link"
              :class="[
                item.path === '/' ? route.path === item.path : route.fullPath.startsWith(item.path) ? 'nav-link-active' : '',
                isSidebarOpen ? 'justify-start' : 'justify-center',
              ]"
            >
              <span class="nav-icon" :class="item.icon" />
              <span
                class="nav-text"
                :class="isSidebarOpen ? 'visible' : 'hidden'"
              >{{ item.name }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <div v-if="isSidebarOpen" class="sidebar-footer">
        <div class="status-indicator">
          <span class="status-dot bg-green-500" />
          <span class="status-text">Active</span>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main
      class="main-content"
      :class="isSidebarOpen ? 'main-content-shifted' : ''"
    >
      <div class="page-container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background-color: #f9fafb;
  color: #1e293b;
  display: flex;
}

/* Sidebar Styles */
.sidebar {
  position: fixed;
  inset-y: 0;
  left: 0;
  z-index: 50;
  background-color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
}

.sidebar-expanded {
  width: 16rem;
}

.sidebar-collapsed {
  width: 5rem;
}

.sidebar-header {
  display: flex;
  align-items: center;
  height: 4rem;
  padding: 0 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.sidebar-logo {
  display: flex;
  align-items: center;
}

.logo-icon {
  color: #4f46e5;
  font-size: 1.5rem;
}

.logo-text {
  margin-left: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  transition: opacity 0.3s;
  color: #4f46e5;
}

.sidebar-toggle {
  margin-left: auto;
  padding: 0.25rem;
  color: #64748b;
  cursor: pointer;
}

.sidebar-toggle:hover {
  color: #334155;
}

.toggle-icon {
  display: block;
  transition: transform 0.3s;
}

.sidebar-nav {
  padding: 1rem 0.75rem;
  flex: 1;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
}

.nav-link:hover {
  background-color: #f3f4f6;
  color: #4f46e5;
}

.nav-link-active {
  background-color: #eef2ff;
  color: #4f46e5;
}

.nav-icon {
  font-size: 1.25rem;
  min-width: 1.25rem;
}

.nav-text {
  margin-left: 0.75rem;
  transition: opacity 0.3s;
  font-size: 0.9375rem;
}

/* Sidebar footer */
.sidebar-footer {
  border-top: 1px solid #e2e8f0;
  padding: 1rem;
}

.status-indicator {
  display: flex;
  align-items: center;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.status-text {
  font-size: 0.875rem;
  color: #64748b;
}

/* Utility classes */
.visible {
  opacity: 1;
}

.hidden {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

/* Main content */
.main-content {
  flex: 1;
  transition: margin-left 0.3s ease-in-out;
}

.main-content-shifted {
  margin-left: 16rem;
}

.page-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
}

/* Icon classes - fallback if UnoCSS icons don't load */
.carbon-delivery::before {
  content: '📦';
}

.carbon-chevron-left::before {
  content: '←';
}

.carbon-chevron-right::before {
  content: '→';
}

.carbon-dashboard::before {
  content: '📊';
}

.carbon-list-boxes::before {
  content: '📋';
}

.carbon-task::before {
  content: '📝';
}

.carbon-diagram::before {
  content: '🔄';
}
</style>
