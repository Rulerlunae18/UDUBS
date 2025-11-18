import axios from 'axios'
import { backendUrl } from "./env"

// ============================================================
// ⚙️ Настройка основного API клиента
// ============================================================

const api = axios.create({
  baseURL: backendUrl('/api'),
  withCredentials: true,
})

// 🔐 Автоматическая подстановка токена
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 🧱 Унифицированная обработка ошибок
api.interceptors.response.use(
  response => response,
  error => {
    console.warn("⚠️ API Error:", error?.response?.data || error.message)
    // Если сессия истекла — удаляем токен и перезагружаем
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============================================================
// 🧠 AUTH — Авторизация / Пользователи
// ============================================================

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password })
  if (data.ok && data.user) {
    localStorage.setItem('user', JSON.stringify(data.user))
  }
  return data
}

export async function logout() {
  await api.post('/auth/logout')
  localStorage.removeItem('user')
  localStorage.removeItem('token')
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me')
  return data.user || null
}

// ============================================================
// 🎮 RENPY — События и игровые профили
// ============================================================

/**
 * Получить все игровые профили
 * (для панели администратора)
 */
export async function getAllProfiles() {
  const { data } = await api.get('/admin/profiles')
  return data.profiles || []
}

/**
 * Получить конкретный игровой профиль
 * @param {string} id — ID профиля из базы
 */
export async function getProfile(id) {
  const { data } = await api.get(`/admin/profiles/${id}`)
  return data.profile || null
}

/**
 * Получить профиль по playerId (из Ren’Py)
 * Это пригодится, если сайт должен показывать данные игрока,
 * который связан с Ren’Py через UUID.
 */
export async function getProfileByPlayerId(playerId) {
  const { data } = await api.get(`/admin/profiles?playerId=${playerId}`)
  return data.profile || null
}

// ============================================================
// 🧾 POST / EVENT — Отправка игровых событий вручную (опционально)
// ============================================================

export async function sendGameEvent(payload) {
  const { data } = await api.post('/renpy/event', payload, {
    headers: { 'X-Event-Token': import.meta.env.VITE_RENPY_EVENT_TOKEN },
  })
  return data
}

// ============================================================
// 📦 EXPORT
// ============================================================

export default api
