<template>
  <div class="relative min-h-screen bg-helix-dark text-helix-green font-mono overflow-hidden">
    <!-- === ФОН === -->
    <div class="crt"></div>
    <canvas ref="pixelCanvas" class="pixel-canvas"></canvas>
    <div class="scanline"></div>

    <!-- === ГЛИТЧ ЛИНИИ === -->
    <div
      v-for="line in glitchLines"
      :key="line.id"
      class="glitch-line"
      :style="{ top: line.y + 'px', left: line.x + 'px' }"
    >
      {{ line.text }}
    </div>

    <!-- === КОНТЕНТ === -->
    <div class="relative z-10 max-w-6xl mx-auto p-8">
      <h1
        class="text-2xl text-center mb-10 text-helix-light tracking-wider drop-shadow-[0_0_10px_rgba(0,255,150,0.6)]"
      >
        [ РЕЕСТР УЧЕНЫХ ]
      </h1>

      <div v-if="loading" class="text-center opacity-70">ДОСТУП К БАЗЕ ДАННЫХ...</div>

      <div
        v-else-if="fakeUsers.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <div
          v-for="user in fakeUsers"
          :key="user.id"
          @click="goToProfile(user.id)"
          class="cursor-pointer border border-helix-green/50 bg-black/40 p-6 shadow-glow 
                 hover:bg-helix-green/10 hover:scale-[1.02] transition-all duration-200 
                 relative flex flex-col items-center text-center rounded-md"
        >
          <img
            :src="user.avatarUrl ? backendUrl(user.avatarUrl) : '/default-avatar.png'"
            alt="аватар"
            class="w-28 h-28 object-cover rounded-full border border-helix-green/60 shadow-glow mb-3"
          />

          <h3 class="font-bold text-lg text-helix-light tracking-wide">
            {{ user.codename }}
          </h3>

          <p class="text-sm opacity-70">
            {{ user.rank || 'Исследователь' }}
          </p>

          <p v-if="user.clearance" class="text-xs opacity-60 mt-1">
            Допуск: {{ user.clearance }}
          </p>

          <p
            class="text-xs opacity-80 text-left border-t border-helix-green/30 pt-2 mt-3 leading-snug w-full"
          >
            {{ user.bio || 'Записи в базе данных не найдены.' }}
          </p>

          <div
            class="absolute top-2 right-2 text-[10px] opacity-60 font-bold tracking-widest"
          >
            [ ID: {{ user.id.toString().padStart(3, '0') }} ]
          </div>
        </div>
      </div>

      <div v-else class="text-center opacity-70">
        РЕГИСТРИРОВАННЫЕ УЧЕНЫЕ НЕ НАЙДЕНЫ.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { backendUrl } from '../services/env'

const router = useRouter()
const fakeUsers = ref([])
const loading = ref(true)

/* === ЗАГРУЗКА ДАННЫХ === */
const loadFakeUsers = async () => {
  try {
    const res = await api.get('/fakeusers')
    fakeUsers.value = res.data || []
  } catch (err) {
    console.error('Ошибка загрузки учёных:', err)
  } finally {
    loading.value = false
  }
}

const goToProfile = (id) => {
  router.push(`/personnel/${id}`)
}

/* === PIXEL BACKGROUND === */
const pixelCanvas = ref(null)
let ctx, pixels = [], animFrame, glitchTimer

const initPixels = () => {
  const w = (pixelCanvas.value.width = window.innerWidth)
  const h = (pixelCanvas.value.height = window.innerHeight)
  pixels = Array.from({ length: 120 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speedY: 0.2 + Math.random() * 1.2,
    speedX: (Math.random() - 0.5) * 0.6,
    size: Math.random() * 2 + 1,
    alpha: 0.2 + Math.random() * 0.5,
  }))
}

const draw = () => {
  const w = pixelCanvas.value.width
  const h = pixelCanvas.value.height
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
  ctx.fillRect(0, 0, w, h)
  pixels.forEach((p) => {
    ctx.fillStyle = `rgba(0,255,100,${p.alpha})`
    ctx.fillRect(p.x, p.y, p.size, p.size)
    p.y += p.speedY
    p.x += p.speedX
    if (p.y > h) p.y = 0
    if (p.x > w) p.x = 0
    if (p.x < 0) p.x = w
  })
  animFrame = requestAnimationFrame(draw)
}

/* === ГЛИТЧ === */
const glitchLines = ref([])
const generateGlitch = () => {
  const words = [
    'СИГНАЛ ГОТОВ',
    'ДОСТУП К ФАЙЛАМ УЧЕНЫХ...',
    'СИНХРОНИЗАЦИЯ НОДЫ УСПЕШНА',
    'СИГНАЛ ТРЕЙСА: СТАБИЛЬНЫЙ'
  ]
  glitchLines.value.push({
    id: Date.now(),
    text: words[Math.floor(Math.random() * words.length)],
    x: Math.random() * window.innerWidth * 0.8,
    y: Math.random() * window.innerHeight * 0.8,
  })
  setTimeout(() => glitchLines.value.shift(), 1800)
}

onMounted(() => {
  loadFakeUsers()
  ctx = pixelCanvas.value.getContext('2d')
  initPixels()
  draw()
  glitchTimer = setInterval(generateGlitch, 1800)
  window.addEventListener('resize', initPixels)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animFrame)
  clearInterval(glitchTimer)
  window.removeEventListener('resize', initPixels)
})
</script>

<style scoped>
.pixel-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.35;
  mix-blend-mode: lighten;
  pointer-events: none;
  z-index: 0;
}

.scanline {
  position: fixed;
  top: -100%;
  width: 100%;
  height: 20%;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0, 255, 100, 0.15),
    transparent
  );
  animation: scan 6s linear infinite;
  z-index: 1;
  pointer-events: none;
}

@keyframes scan {
  0% {
    top: -20%;
  }
  100% {
    top: 120%;
  }
}

.crt {
  pointer-events: none;
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    rgba(0, 0, 0, 0.18) 0px,
    rgba(0, 0, 0, 0.18) 1px,
    transparent 2px
  );
  mix-blend-mode: screen;
  z-index: 1;
}

.glitch-line {
  position: fixed;
  font-size: 12px;
  opacity: 0.65;
  color: rgba(0, 255, 100, 0.75);
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

.shadow-glow {
  box-shadow: 0 0 10px rgba(0, 255, 150, 0.5);
}

.fade-in {
  animation: fade-in 0.6s ease-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
