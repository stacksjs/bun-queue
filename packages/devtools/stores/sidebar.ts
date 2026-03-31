/**
 * Sidebar collapse state store with persistence.
 *
 * Usage: const { collapsed, toggle } = useSidebar()
 */
export function useSidebar() {
  return defineStore('sidebar', () => {
    const collapsed = state(false)
    function toggle() { collapsed.set(!collapsed()) }
    return { collapsed, toggle }
  }, { persist: true })
}
