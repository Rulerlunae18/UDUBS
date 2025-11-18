<template>
  <div class="noaccess fixed inset-0 bg-black text-green-400 font-mono flex items-center justify-center overflow-hidden">
    <canvas ref="pixelCanvas" class="pixel-canvas"></canvas>
    <div class="crt"></div>
    <div class="scanline"></div>

    <div class="relative z-10 text-center fade-in">
      <h1 class="text-5xl font-bold text-red-500 mb-4 glitch" data-text="ПАШОЛ НАХУЙ">
        ПАШОЛ НАХУЙ
      </h1>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const router = useRouter()
const countdown = ref(7)

onMounted(() => {
  // Отчёт о вторжении (без await — fire-and-forget)
  api.post('/honeypot/attempt', { reason: 'Unauthorized access to admin' }, { withCredentials: true }).catch(() => {})

  // Запуск звука тревоги
  const audio = new Audio('/alert.mp3')
  audio.volume = 0.5
  audio.play().catch(() => {})

  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      // logout и редирект
      api.post('/auth/logout', {}, { withCredentials: true }).catch(() => {})
      router.push('/access')
    }
  }, 1000)
})

/* === ФОН PIXEL GLITCH === */
const pixelCanvas = ref(null)
let ctx, pixels = [], animFrame

const initPixels = () => {
  const w = (pixelCanvas.value.width = window.innerWidth)
  const h = (pixelCanvas.value.height = window.innerHeight)
  pixels = Array.from({ length: 200 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speedY: 0.2 + Math.random() * 1.2,
    size: Math.random() * 2 + 1,
    alpha: 0.2 + Math.random() * 0.5,
  }))
}

const draw = () => {
  const w = pixelCanvas.value.width
  const h = pixelCanvas.value.height
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(0, 0, w, h)
  pixels.forEach((p) => {
    ctx.fillStyle = `rgba(255,0,0,${p.alpha})`
    ctx.fillRect(p.x, p.y, p.size, p.size)
    p.y += p.speedY
    if (p.y > h) p.y = 0
  })
  animFrame = requestAnimationFrame(draw)
}

onMounted(() => {
  ctx = pixelCanvas.value.getContext('2d')
  initPixels()
  draw()
  window.addEventListener('resize', initPixels)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', initPixels)
})
</script>

<style scoped>
.noaccess {
  animation: flash-bg 0.1s infinite alternate;
}
@keyframes flash-bg {
  from { background-color: black; }
  to { background-color: #020202; }
}

/* CRT эффекты */
.pixel-canvas, .crt, .scanline { position: fixed; inset: 0; pointer-events: none; }
.pixel-canvas { opacity: 0.3; mix-blend-mode: lighten; z-index: 0; }
.crt { background: repeating-linear-gradient(rgba(255,0,0,0.12) 0px, rgba(255,0,0,0.12) 1px, transparent 2px); mix-blend-mode: screen; z-index: 1; }
.scanline {
  height: 25%;
  background: linear-gradient(to bottom, transparent, rgba(255,0,0,0.2), transparent);
  animation: scan 4s linear infinite;
  z-index: 2;
}
@keyframes scan { 0% { top: -25%; } 100% { top: 125%; } }

.fade-in { animation: fade-in 0.5s ease-out; }
@keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

.glitch-text {
  animation: glitchText 2s infinite;
}
@keyframes glitchText {
  0% { text-shadow: 2px 0 red, -2px 0 cyan; }
  50% { text-shadow: -2px 0 red, 2px 0 cyan; }
  100% { text-shadow: 2px 0 red, -2px 0 cyan; }
}
</style>
