import { reactive } from 'vue'

export const authStore = reactive({
  type: localStorage.getItem('authType') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,

  login(user, token, type) {
    this.user = user
    this.token = token
    this.type = type

    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    localStorage.setItem('authType', type)
  },

  logout() {
    this.user = null
    this.token = null
    this.type = null

    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('authType')
  },
})
