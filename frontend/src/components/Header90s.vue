<template>
  <header
    class="flex justify-between items-center border-b border-green-500 p-3 text-green-400 font-mono bg-black/60 backdrop-blur-sm relative z-50"
  >
    <!-- Левая часть: Имя и роль -->
    <div class="tracking-wider">
      {{ auth.user?.name || 'Гость' }} · {{ auth.user?.role || 'ПОЛЬЗОВАТЕЛЬ' }}
    </div>

    <!-- Кнопка меню -->
    <button
      @click="toggleMenu"
      class="border border-green-400 px-3 py-1 hover:bg-green-500/20 transition-all"
    >
      МЕНЮ
    </button>

    <!-- Выпадающее меню -->
    <transition name="fade">
      <DropdownMenu v-if="showMenu" @close="closeMenu" />
    </transition>
  </header>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import DropdownMenu from './DropdownMenu.vue'

// 🔹 Получаем auth из provide() (создан в main.js)
const auth = inject('auth', { user: { name: 'Guest', role: 'USER' } })
const showMenu = ref(false)

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const closeMenu = () => {
  showMenu.value = false
}

// Закрытие меню при клике вне панели
onMounted(() => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-panel') && !e.target.closest('button')) {
      showMenu.value = false
    }
  })
})
</script>

<style scoped>
header {
  border-image: linear-gradient(to right, #00ff99 0%, #009966 100%) 1;
  box-shadow: 0 0 5px #00ff88, inset 0 0 10px #006644;
  text-shadow: 0 0 2px #00ff88, 0 0 5px #00ff88;
}
button {
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 3px #00ff88;
}
button:hover {
  box-shadow: 0 0 10px #00ff88 inset;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity .25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
