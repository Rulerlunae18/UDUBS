<template>
  <div class="relative min-h-screen bg-helix-dark text-helix-green font-mono overflow-hidden">

    <!-- CRT фон -->
    <div class="crt"></div>
    <canvas ref="pixelCanvas" class="pixel-canvas"></canvas>
    <div class="scanline"></div>

    <!-- Глитч-линии -->
    <div
      v-for="line in glitchLines"
      :key="line.id"
      class="glitch-line"
      :style="{ top: line.y + 'px', left: line.x + 'px' }"
    >
      {{ line.text }}
    </div>

    <!-- Контент -->
    <div class="relative z-10 flex flex-col items-center justify-center min-h-screen space-y-10 fade-in">

      <h1 class="text-3xl tracking-widest text-helix-light drop-shadow-[0_0_10px_rgba(0,255,150,0.6)] uppercase">
        [ ЦЕНТР УПРАВЛЕНИЯ АДМИНОМ ]
      </h1>

      <p class="opacity-70 text-sm mb-8">Выберите режим работы:</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl text-center">
        <button class="admin-btn" @click="$router.push('/admin/posts')">
          [ УПРАВЛЕНИЕ ПОСТАМИ ]
        </button>

        <button class="admin-btn" @click="$router.push('/admin/players')">
          [ СПИСОК ИГРОКОВ ]
        </button>

        <button class="admin-btn" @click="$router.push('/admin/realusers')">
          [ СПИСОК ПОЛЬЗОВАТЕЛЕЙ ]
        </button>

        <button class="admin-btn" @click="$router.push('/admin/fakeusers')">
          [ УПРАВЛЕНИЕ УЧЁНЫМИ ]
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

/* === PIXEL BACKGROUND === */
const pixelCanvas = ref(null)
let ctx, pixels = [], animFrame

const initPixels = () => {
  const w = pixelCanvas.value.width = window.innerWidth
  const h = pixelCanvas.value.height = window.innerHeight
  pixels = Array.from({ length: 120 }, () => ({
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
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
  ctx.fillRect(0, 0, w, h)

  pixels.forEach(p => {
    ctx.fillStyle = `rgba(0,255,100,${p.alpha})`
    ctx.fillRect(p.x, p.y, p.size, p.size)
    p.y += p.speedY
    if (p.y > h) p.y = 0
  })
  animFrame = requestAnimationFrame(draw)
}

/* === Glitch Overlay === */
const glitchLines = ref([])
const generateGlitch = () => {
  const words = [
    "UPLINK READY",
    "ROUTING SIGNAL...",
    "ACCESS VERIFIED",
    "PROTOCOL D-13 ACTIVE",
  ]
  glitchLines.value.push({
    id: Date.now(),
    text: words[Math.floor(Math.random() * words.length)],
    x: Math.random() * window.innerWidth * 0.8,
    y: Math.random() * window.innerHeight * 0.8,
  })
  setTimeout(() => glitchLines.value.shift(), 1500)
}

onMounted(() => {
  ctx = pixelCanvas.value.getContext('2d')
  initPixels()
  draw()
  setInterval(generateGlitch, 2000)
  window.addEventListener('resize', initPixels)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', initPixels)
})
</script>

<style scoped>
.admin-btn {
  border: 1px solid rgba(0,255,150,0.6);
  color: #00ff9d;
  background: rgba(0,0,0,0.4);
  padding: 1.5rem 1rem;
  font-weight: bold;
  font-size: 16px;
  transition: all 0.2s ease;
  text-shadow: 0 0 6px rgba(0,255,150,0.6);
  box-shadow: 0 0 8px rgba(0,255,100,0.3);
}
.admin-btn:hover {
  background: rgba(0,255,100,0.1);
  transform: scale(1.05);
  box-shadow: 0 0 12px rgba(0,255,150,0.6);
  color: #baffd1;
}

/* CRT эффекты */
.pixel-canvas, .crt, .scanline { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.pixel-canvas { opacity: 0.35; mix-blend-mode: lighten; }
.crt { background: repeating-linear-gradient(rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 2px); mix-blend-mode: screen; }
.scanline {
  height: 20%;
  background: linear-gradient(to bottom, transparent, rgba(0,255,100,0.15), transparent);
  animation: scan 6s linear infinite;
}
@keyframes scan { 0% { top: -20%; } 100% { top: 120%; } }

.glitch-line {
  position: fixed;
  font-size: 12px;
  opacity: 0.65;
  color: rgba(0,255,100,0.75);
  text-shadow: 0 0 6px rgba(0,255,150,0.6);
  animation: glitchFade 2s ease-out forwards;
}
@keyframes glitchFade {
  0% { opacity: 0; transform: scale(0.95); }
  20% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.1); }
}
.fade-in { animation: fade-in 0.6s ease-out; }
@keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
</style>
