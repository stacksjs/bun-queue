import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Import styles in the correct order
import '@unocss/reset/tailwind.css'
import './assets/base.css'
import 'uno.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
