/**
 * Sidebar collapse state store with persistence.
 */
export const useSidebar = defineStore('sidebar', () => {
  const collapsed = state(false)
  function toggle() { collapsed.set(!collapsed()) }
  return { collapsed, toggle }
}, { persist: true })
