import { defineConfig } from 'unocss'

export default defineConfig({
  theme: {
    colors: {
      primary: '#4f46e5',
      secondary: '#64748b',
      success: '#10b981',
      danger: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
  },
  shortcuts: {
    'btn': 'py-2 px-4 font-semibold rounded-lg shadow-md transition-colors duration-200',
    'btn-primary': 'bg-primary text-white hover:bg-primary/90',
    'btn-secondary': 'bg-secondary text-white hover:bg-secondary/90',
    'card': 'bg-white p-4 rounded-lg shadow',
    'badge': 'px-2 py-0.5 text-xs font-semibold rounded-full',
    'badge-success': 'bg-success/20 text-success',
    'badge-danger': 'bg-danger/20 text-danger',
    'badge-warning': 'bg-warning/20 text-warning',
    'badge-info': 'bg-info/20 text-info',
  },
})
