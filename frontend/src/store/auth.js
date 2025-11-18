import { reactive } from 'vue'

export const authStore = reactive({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,

  login(user, token) {
    this.user = user
    this.token = token
    localStorage.setItem('user', JSON.stringify(user))
  },

  logout() {
    this.user = null
    this.token = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  },
})
