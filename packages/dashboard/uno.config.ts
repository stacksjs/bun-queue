import { defineConfig, presetIcons, presetUno, presetWebFonts, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetWebFonts({
      fonts: {
        sans: 'Inter:300,400,500,600,700',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
  ],
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
    'card': 'bg-white rounded-lg shadow',
    'btn': 'px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none',
    'btn-primary': 'bg-indigo-600 hover:bg-indigo-700 text-white',
    'btn-secondary': 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    'btn-danger': 'bg-red-500 hover:bg-red-600 text-white',
    'btn-outline': 'border border-gray-300 hover:bg-gray-100',
    'badge': 'px-2 py-1 rounded-full text-xs font-semibold',
    'badge-success': 'bg-green-100 text-green-800',
    'badge-warning': 'bg-yellow-100 text-yellow-800',
    'badge-info': 'bg-blue-100 text-blue-800',
    'badge-danger': 'bg-red-100 text-red-800',
  },
})
