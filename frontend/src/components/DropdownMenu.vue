<template>
  <div
    class="dropdown-panel absolute right-3 top-14 bg-black border border-green-500 p-4 w-60 text-green-400 shadow-lg z-50"
  >
    <ul class="flex flex-col gap-2">
      <!-- Главная -->
      <li>
        <router-link to="/home">Главная</router-link>
      </li>

      <!-- Профиль -->
      <li>
        <router-link to="/profile">Профиль</router-link>
      </li>

      <!-- Архив -->
      <li>
        <router-link to="/archive">Архив</router-link>
      </li>

      <!-- 🧬 Галерея учёных — доступна всем -->
      <li>
        <router-link to="/docs">Документы</router-link>
      </li>

      <li>
        <router-link to="/fake-users">Исследователи</router-link>
      </li>

      <!-- 🧠 Админ-панель -->
      <li v-if="auth.user && auth.user.role === 'ADMIN'">
        <router-link to="/admin">Панель администратора</router-link>
      </li>

      <!-- 🚪 Выход -->
      <li
        class="text-red-400 cursor-pointer hover:text-red-300 transition"
        @click="logout"
      >
        Выход
      </li>
    </ul>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { useRouter } from 'vue-router'

const auth = inject('auth')
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.dropdown-panel {
  backdrop-filter: blur(6px);
  background: rgba(0, 0, 0, 0.8);
  box-shadow: 0 0 15px rgba(0, 255, 150, 0.3),
              inset 0 0 10px rgba(0, 255, 150, 0.2);
  text-shadow: 0 0 5px rgba(0, 255, 150, 0.6);
  border-radius: 4px;
  animation: panelFade 0.2s ease-out;
}

@keyframes panelFade {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

a {
  display: block;
  padding: 6px 0;
  transition: all 0.2s;
}
a:hover {
  color: #00ffaa;
  text-shadow: 0 0 10px #00ffaa;
}
</style>
