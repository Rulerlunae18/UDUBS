<template>
  <div class="min-h-screen bg-black text-green-400 font-mono relative overflow-hidden">
    <CRTBackground />

    <!-- 🌐 Системная инициализация -->
    <template v-if="loading">
      <transition name="fade">
        <div
          class="absolute inset-0 flex flex-col items-center justify-center 
                 text-green-500 opacity-80 tracking-widest text-sm space-y-2 z-50 bg-black"
        >
          <p class="animate-blink">ROUTING CORE PROTOCOLS...</p>
          <p class="opacity-70">VERIFYING AUTH LINK...</p>
          <p class="opacity-40">PLEASE STAND BY</p>
        </div>
      </transition>
    </template>

    <!-- 🔸 Основной интерфейс -->
    <template v-else>
      <div class="relative z-10">
        <Header90s v-if="auth.user" />
        <main class="p-4 sm:p-8">
          <router-view />
        </main>
        <Footer90s />
      </div>
    </template>
  </div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue'
import CRTBackground from './components/CRTBackground.vue'
import Header90s from './components/Header90s.vue'
import Footer90s from './components/Footer90s.vue'

const auth = inject('auth')
const loading = ref(true)

onMounted(() => {
  // небольшая пауза перед показом интерфейса
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script>

<style scoped>
/* ===== Анимации перехода ===== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ===== Эффект мерцания текста ===== */
.animate-blink {
  animation: blink 1.4s steps(2, start) infinite;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ===== Общий стиль терминала ===== */
body {
  background: radial-gradient(circle at center, #001100 0%, #000000 100%);
  color: #00ff88;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 2px #00ff88, 0 0 5px #00ff88;
}

a {
  color: #00ff99;
  text-decoration: underline;
  transition: color 0.2s;
}

a:hover {
  color: #66ffcc;
}
</style>
