import axios from 'axios'
import { backendUrl } from "./env"

// ============================================================
// ⚙️ Base API client
// ============================================================

const api = axios.create({
  baseURL: backendUrl('/api'),
  withCredentials: false,   // ❗ JWT → больше не нужны cookie
})

// ============================================================
// 🔐 Автоподстановка токена
// ============================================================

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ============================================================
// 🧱 Глобальная обработка ошибок
// ============================================================

api.interceptors.response.use(
  response => response,
  error => {
    const status = error?.response?.status
    const err = error?.response?.data?.error

    console.warn("⚠️ API Error:", error?.response?.data || error.message)

    // 401 → токен недействителен
    if (status === 401) {
      // сервер может вернуть:
      // TOKEN_EXPIRED / TOKEN_INVALID / INVALID_PAYLOAD / NO_TOKEN
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // не перенаправлять автоматически со всех страниц,
      // но для LOGIN pages это подходит
      window.location.href = '/access'
    }

    return Promise.reject(error)
  }
)

// ============================================================
// 🧠 AUTH
// ============================================================

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })

  if (data.ok && data.token) {
    // сохраняем токен
    localStorage.setItem('token', data.token)

    // сохраняем ПОЛНУЮ информацию о типе
    localStorage.setItem('authType', data.type)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  return data
}


export async function logout() {
  try {
    await api.post('/auth/logout')
  } catch {}

  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me')
  return data.user || null
}

// ============================================================
// 🎮 ADMIN PANEL / PROFILES
// ============================================================

export async function getAllProfiles() {
  const { data } = await api.get('/admin/profiles')
  return data.profiles || []
}

export async function getProfile(id) {
  const { data } = await api.get(`/admin/profiles/${id}`)
  return data.profile || null
}

export async function getProfileByPlayerId(playerId) {
  const { data } = await api.get(`/admin/profiles?playerId=${playerId}`)
  return data.profile || null
}

// ============================================================
// 🎮 GAME EVENT (RenPy)
// ============================================================

export async function sendGameEvent(payload) {
  const { data } = await api.post('/renpy/event', payload, {
    headers: { 'X-Event-Token': import.meta.env.VITE_RENPY_EVENT_TOKEN },
  })
  return data
}

export default api
