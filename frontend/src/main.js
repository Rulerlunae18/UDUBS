import { createApp, reactive } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import './style.css'
import { io } from 'socket.io-client'

// ============================================================
// 🟢 Socket.io
// ============================================================

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  transports: ['websocket', 'polling'],
  secure: true,
  autoConnect: true,
  reconnection: true,
  withCredentials: true,
});


// ============================================================
// 🔐 AUTH Store (JWT)
// ============================================================

const auth = reactive({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,

  login(user, token) {
    this.user = user
    this.token = token

    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)

    // 🔥 Если это RealUser → отправляем онлайн-сигнал
    if (user?.realUserId) {
      socket.emit('realuser:online', user.realUserId)
    }
  },

  logout() {
    if (this.user?.realUserId) {
      socket.emit('realuser:offline', this.user.realUserId)
    }

    this.user = null
    this.token = null

    localStorage.removeItem('user')
    localStorage.removeItem('token')
  },
})

// ============================================================
// 🔄 Socket: восстанавливаем статус при переподключении
// ============================================================

socket.on('connect', () => {
  if (auth.user?.realUserId) {
    socket.emit('realuser:online', auth.user.realUserId)
  }
})

// 🔄 При загрузке страницы (refresh)
if (auth.user?.realUserId) {
  socket.emit('realuser:online', auth.user.realUserId)
}

// ============================================================
// 🚀 Запуск приложения
// ============================================================

const app = createApp(App)
app.provide('auth', auth)
app.provide('socket', socket)
app.use(router)
app.mount('#app')
