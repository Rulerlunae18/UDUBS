<template>
  <div class="relative min-h-screen bg-helix-dark text-helix-green font-mono overflow-hidden">
    <!-- === ФОН === -->
    <div class="crt"></div>
    <canvas ref="pixelCanvas" class="pixel-canvas"></canvas>
    <div class="scanline"></div>

    <div
      v-for="line in glitchLines"
      :key="line.id"
      class="glitch-line"
      :style="{ top: line.y + 'px', left: line.x + 'px' }"
    >
      {{ line.text }}
    </div>

    <!-- === КОНТЕНТ === -->
    <div class="relative z-10 max-w-6xl mx-auto py-12 px-6 fade-in">
      <h1
        class="text-2xl mb-8 text-center tracking-widest text-helix-light drop-shadow-[0_0_10px_rgba(0,255,150,0.6)]"
      >
        [ БАЗА ДАННЫХ ИЗОБРАЖЕНИЙ АРХИВА ]
      </h1>

      <div v-if="loading" class="text-center opacity-60">СКАНИРОВАНИЕ ФАЙЛОВОЙ СИСТЕМЫ...</div>

      <!-- 🟢 Только изображения -->
      <div v-else-if="imagePosts.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div
          v-for="p in imagePosts"
          :key="p.id"
          class="border border-helix-green/50 p-2 bg-black/40 hover:bg-helix-green/10 cursor-pointer transition-all duration-300 shadow-glow relative group"
          @click="$router.push(`/post/${p.id}`)"
        >
          <img
            v-if="p.coverImage"
            :src="p.coverImage.startsWith('http')
              ? p.coverImage
              : `${backendUrl(p.coverImage)}`"
            class="w-full h-48 object-cover border border-helix-green/40 mb-2 transition-transform duration-300 group-hover:scale-[1.03]"
          />

          <p class="text-sm text-center tracking-wide group-hover:text-helix-light transition">
            {{ p.title }}
          </p>

          <p v-if="p.fileType" class="text-[10px] text-center opacity-50 mt-1 italic">
            [{{ p.fileType.toUpperCase() }}]
          </p>

          <!-- подпись -->
          <div
            v-if="p.coverCaption"
            class="absolute bottom-2 left-0 right-0 text-[10px] text-center opacity-0 group-hover:opacity-70 transition-all duration-300 italic"
          >
            {{ p.coverCaption }}
          </div>
        </div>
      </div>

      <p v-else class="opacity-60 text-center mt-10">В АРХИВЕ НЕ НАЙДЕНО ИЗОБРАЖЕНИЙ.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import api from '../services/api'
import { backendUrl } from '../services/env'

const posts = ref([])
const loading = ref(true)

/* === LOAD DATA === */
onMounted(async () => {
  try {
    const res = await api.get('/posts/archive')
    posts.value = res.data || []
  } catch (err) {
    console.error('Ошибка загрузки архива:', err)
  } finally {
    loading.value = false
  }
})

/* === ФИЛЬТР ТОЛЬКО ДЛЯ ИЗОБРАЖЕНИЙ === */
const imagePosts = computed(() =>
  posts.value.filter(p => {
    const type = (p.fileType || '').toLowerCase()
    return (
      type.startsWith('image/') ||
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => type.includes(ext))
    )
  })
)

/* === PIXEL BACKGROUND === */
const pixelCanvas = ref(null)
let ctx, pixels = [], animFrame

const initPixels = () => {
  const w = (pixelCanvas.value.width = window.innerWidth)
  const h = (pixelCanvas.value.height = window.innerHeight)
  pixels = Array.from({ length: 120 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speedY: 0.2 + Math.random() * 1.2,
    speedX: (Math.random() - 0.5) * 0.6,
    size: Math.random() * 2 + 1,
    alpha: 0.2 + Math.random() * 0.5
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
    p.x += p.speedX
    if (p.y > h) p.y = 0
    if (p.x > w) p.x = 0
    if (p.x < 0) p.x = w
  })
  animFrame = requestAnimationFrame(draw)
}

/* === GLITCH OVERLAY === */
const glitchLines = ref([])
const generateGlitch = () => {
  const words = [
    'ДОСТУП К СЕКТОРУ ФАЙЛОВ...',
    'ДЕКОДИРОВАНИЕ ДАННЫХ ИЗОБРАЖЕНИЯ...',
    'ПРОТОКОЛ SIGMA-13 АКТИВЕН',
    'ИЗВЛЕЧЕНИЕ БЛОКОВ ПАМЯТИ...'
  ]
  glitchLines.value.push({
    id: Date.now(),
    text: words[Math.floor(Math.random() * words.length)],
    x: Math.random() * window.innerWidth * 0.8,
    y: Math.random() * window.innerHeight * 0.8
  })
  setTimeout(() => glitchLines.value.shift(), 1700)
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
  background: linear-gradient(to bottom, transparent, rgba(0,255,100,0.15), transparent);
  animation: scan 6s linear infinite;
  z-index: 1;
  pointer-events: none;
}

@keyframes scan {
  0% { top: -20%; }
  100% { top: 120%; }
}

.crt {
  pointer-events: none;
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 2px);
  mix-blend-mode: screen;
  z-index: 1;
}

.glitch-line {
  position: fixed;
  font-size: 12px;
  opacity: 0.65;
  color: rgba(0,255,100,0.75);
  text-shadow: 0 0 6px rgba(0,255,150,0.6);
  animation: glitchFade 2s ease-out forwards;
  pointer-events: none;
}

@keyframes glitchFade {
  0% { opacity: 0; transform: scale(0.95); }
  20% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.1); }
}

.fade-in {
  animation: fade-in 0.6s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
