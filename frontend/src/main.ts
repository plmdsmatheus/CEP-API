import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { iniciarTemaDoSistema } from './utils/tema'

iniciarTemaDoSistema()
createApp(App).mount('#app')
