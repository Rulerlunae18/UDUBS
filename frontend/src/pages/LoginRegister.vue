<template>
  <div
    class="relative flex flex-col items-center justify-center h-screen w-screen bg-helix-dark text-helix-green font-mono overflow-hidden"
  >
    <!-- CRT-эффект и фон -->
    <div class="crt absolute inset-0"></div>
    <canvas ref="pixelCanvas" class="absolute inset-0 z-0"></canvas>
    <div class="scanline"></div>

    <!-- Эффект случайных строк -->
    <div
      v-for="line in glitchLines"
      :key="line.id"
      class="glitch-line"
      :style="{ top: line.y + 'px', left: line.x + 'px' }"
    >
      {{ line.text }}
    </div>

    <!-- Заголовок -->
    <Transition name="fade" mode="out-in">
      <h1
        :key="isRegister ? 'register-title' : 'login-title'"
        class="text-3xl md:text-4xl mb-8 tracking-widest font-bold text-helix-light
               drop-shadow-[0_0_12px_rgba(0,255,153,0.6)] transition-all duration-700 z-10"
      >
        OBDUBS-09 TERMINAL //
        <span
          :class="[
            isRegister ? 'text-helix-amber' : 'text-helix-green',
            'transition-all duration-700 drop-shadow-[0_0_8px_rgba(0,255,150,0.6)]'
          ]"
        >
          {{ isRegister ? 'APPLICATION MODE' : 'ACCESS GATEWAY' }}
        </span>
      </h1>
    </Transition>

    <!-- Формы -->
    <Transition name="fade" mode="out-in">
      <form
        v-if="!isRegister"
        key="login"
        @submit.prevent="login"
        class="bg-black/30 backdrop-blur-md border border-helix-green p-8 rounded-lg shadow-glow w-96 flex flex-col gap-4 z-10 transition-all duration-700"
      >
        <label class="text-helix-light text-sm">Электронная почта</label>
        <input v-model="email" type="email" placeholder="scarletvision@gmail.com" required />

        <label class="text-helix-light text-sm">Пароль</label>
        <input v-model="password" type="password" placeholder="••••••••" required />

        <button type="submit" class="btn mt-4 uppercase tracking-widest">ДОСТУП</button>

        <p v-if="error" class="text-helix-amber text-sm mt-2 text-center animate-pulse">
          ⚠ {{ error }}
        </p>

        <p
          class="text-xs mt-3 opacity-80 text-center cursor-pointer hover:text-helix-amber"
          @click="toggleMode"
        >
          Запросить доступ →
        </p>
      </form>

      <form
        v-else
        key="register"
        @submit.prevent="submitFake"
        class="bg-black/30 backdrop-blur-md border border-helix-amber p-8 rounded-lg shadow-amber w-96 flex flex-col gap-4 z-10 transition-all duration-700"
      >
        <label class="text-helix-light text-sm">Электронная почта</label>
        <input v-model="email" type="email" placeholder="scarletvision@gmail.com" required />

        <label class="text-helix-light text-sm">Подтверждающий документ</label>
        <input type="file" @change="onFile" class="text-sm text-helix-light" required />

        <button type="submit" class="btn mt-4 uppercase tracking-widest">ОТПРАВИТЬ</button>

        <p v-if="message" class="text-helix-amber text-center mt-4 animate-pulse">
          {{ message }}
        </p>

        <p
          class="text-xs mt-3 opacity-80 text-center cursor-pointer hover:text-helix-green"
          @click="toggleMode"
        >
          ← Уже есть доступ
        </p>
      </form>
    </Transition>

    <!-- Футер -->
    <footer class="absolute bottom-4 text-xs opacity-70 text-center z-10">
      © 1997 OBDUBS-09 Research — Объединённая база данных уникальных биологических существ · Подструктура D-13
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import api from '../services/api'
import { ref, onMounted, onBeforeUnmount, inject } from 'vue'

// === Состояние ===
const isRegister = ref(false)
const email = ref('')
const password = ref('')
const file = ref(null)
const error = ref('')
const message = ref('')
const router = useRouter()
const socket = inject('socket')

// === Анимация пикселей ===
const pixelCanvas = ref(null)
let ctx, pixels = [], animFrame

const initPixels = () => {
  const w = (pixelCanvas.value.width = window.innerWidth)
  const h = (pixelCanvas.value.height = window.innerHeight)
  pixels = Array.from({ length: 140 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speedY: 0.3 + Math.random() * 1.4,
    speedX: (Math.random() - 0.5) * 0.8,
    size: Math.random() * 2 + 1,
    alpha: 0.25 + Math.random() * 0.5,
  }))
}

const draw = () => {
  const w = pixelCanvas.value.width
  const h = pixelCanvas.value.height
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
  ctx.fillRect(0, 0, w, h)

  pixels.forEach(p => {
    ctx.fillStyle = `rgba(0,255,100,${p.alpha})`
    ctx.fillRect(p.x, p.y, p.size, p.size)
    p.y += p.speedY
    p.x += p.speedX
    if (Math.random() < 0.002) p.alpha = 1 // редкая вспышка
    else if (p.alpha > 0.3) p.alpha -= 0.02

    if (p.y > h) p.y = 0
    if (p.x > w) p.x = 0
    if (p.x < 0) p.x = w
  })

  animFrame = requestAnimationFrame(draw)
}

// === Глюки ===
const glitchLines = ref([])
const generateGlitch = () => {
  const phrases = [
    'ДОСТУП К NODE_13...',
    'РАСШИФРОВКА СИГНАЛА...',
    'БИО-Подпись ОБНАРУЖЕНА',
    'ОШИБКА 0x09F3',
    '██ ФРАГМЕНТ ДАННЫХ ██',
    'ПРОТОКОЛ D-13 ВКЛЮЧЕН',
    'ЛОГИРОВАНИЕ ЗАПРОСА',
  ]
  const id = Date.now()
  glitchLines.value.push({
    id,
    text: phrases[Math.floor(Math.random() * phrases.length)],
    x: Math.random() * window.innerWidth * 0.8,
    y: Math.random() * window.innerHeight * 0.8,
  })
  setTimeout(() => {
    glitchLines.value = glitchLines.value.filter(l => l.id !== id)
  }, 2000 + Math.random() * 2000)
}

onMounted(() => {
  ctx = pixelCanvas.value.getContext('2d')
  initPixels()
  draw()
  setInterval(generateGlitch, 1500)
  window.addEventListener('resize', initPixels)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', initPixels)
})

// === Логика форм ===
const toggleMode = () => {
  isRegister.value = !isRegister.value
  email.value = ''
  password.value = ''
  error.value = ''
  message.value = ''
}

const onFile = e => (file.value = e.target.files[0])

const auth = inject('auth')

const login = async () => {
  try {
    const res = await api.post(
      "/auth/login",
      { email: email.value, password: password.value },
      { withCredentials: true }
    );

    const user = res.data.user;

    // сохраняем в глобальное состояние
    auth.login(user, null);

    // 🟢 ЕСЛИ ЭТО RealUser — посылаем online-сигнал
    if (user.realUser) {
      console.log("[SOCKET] RealUser online →", user.id);
      socket?.emit("realuser:online", user.id);
    }

    router.push("/home");
  } catch {
    error.value = "НЕВЕРНЫЙ КОД ДОСТУПА";
    setTimeout(() => (error.value = ""), 3000);
  }
};



const submitFake = async () => {
  const formData = new FormData()
  formData.append('email', email.value)
  if (file.value) formData.append('file', file.value)

  try {
    await api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    message.value = 'Ваша заявка отправлена. Статус: на рассмотрении...'
  } catch {
    message.value = 'Ошибка при отправке. Попробуйте снова.'
  }
}
</script>

<style scoped>
canvas {
  background: transparent;
  mix-blend-mode: lighten;
  opacity: 0.35;
  image-rendering: pixelated;
}

/* Сканирующий луч */
.scanline {
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 20%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 255, 100, 0.15) 50%,
    transparent 100%
  );
  animation: scan 6s linear infinite;
  mix-blend-mode: screen;
}
@keyframes scan {
  0% {
    top: -20%;
  }
  100% {
    top: 120%;
  }
}

/* Эффект глюков */
.glitch-line {
  position: absolute;
  color: rgba(0, 255, 100, 0.8);
  font-size: 12px;
  opacity: 0.6;
  text-shadow: 0 0 6px rgba(0, 255, 150, 0.6);
  animation: glitchFade 2s ease-out forwards;
  pointer-events: none;
}
@keyframes glitchFade {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  20% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.1);
  }
}

/* Мягкий fade-переход для текста и формы */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease, filter 0.6s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

* {
  user-select: none;
  caret-color: transparent;
}

/* Но оставить выделение для input и textarea */
input, textarea {
  user-select: text;
  caret-color: auto;
}
</style>
