import { createApp, reactive } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import './style.css'
import { io } from 'socket.io-client'

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000', {
  autoConnect: true,
  reconnection: true,
})

const auth = reactive({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,

  login(user, token) {
    this.user = user
    this.token = token
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)

    // 🟢 ГОВОРИМ СЕРВЕРУ ЧТО ОНЛАЙН — только realUser.id
    if (user?.realUser?.id) {
      socket.emit('realuser:online', user.realUser.id)
    }
  },

  logout() {
    if (this.user?.realUser?.id) {
      socket.emit('realuser:offline', this.user.realUser.id)
    }
    this.user = null
    this.token = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  },
})

// На каждый reconnect
socket.on('connect', () => {
  if (auth.user?.realUser?.id) {
    socket.emit('realuser:online', auth.user.realUser.id)
  }
})

// При перезагрузке вкладки
if (auth.user?.realUser?.id) {
  socket.emit('realuser:online', auth.user.realUser.id)
}

const app = createApp(App)
app.provide('auth', auth)
app.provide('socket', socket)
app.use(router)
app.mount('#app')
