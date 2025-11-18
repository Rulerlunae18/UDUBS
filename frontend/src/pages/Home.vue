<template>
  <div class="relative min-h-screen bg-helix-dark text-helix-green font-mono overflow-hidden">
    <!-- === CRT Background === -->
    <div class="crt"></div>
    <canvas ref="pixelCanvas" class="pixel-canvas"></canvas>
    <div class="scanline"></div>

    <!-- === Глитч-строки === -->
    <div
      v-for="line in glitchLines"
      :key="line.id"
      class="glitch-line"
      :style="{ top: line.y + 'px', left: line.x + 'px' }"
    >
      {{ line.text }}
    </div>

    <!-- === HERO === -->
    <section class="hero shadow-glow border-b border-helix-green py-20 px-6 text-center fade-in">
      <h1 class="hero-title">
        ИССЛЕДОВАТЕЛЬСКАЯ СЕТЬ OBDUBS-09
      </h1>

      <p class="hero-subtitle typing">
        ДОСТУП К МАРШРУТИЗАЦИИ... УСТАНОВКА ПОЛЕВОЙ СВЯЗИ...
      </p>

      <div class="hero-info mt-6">
        <span class="tag">Оператор: {{ auth.user?.name || 'НЕИЗВЕСТЕН' }}</span>
        <span class="tag">Допуск: {{ auth.user?.role || 'БЕЗ ДОСТУПА' }}</span>
        <span class="tag">Подструктура: D-13</span>
      </div>
    </section>

    <!-- === MAIN === -->
    <main class="relative z-10 p-6 md:p-12 space-y-10 max-w-5xl mx-auto">

      <!-- === IDENTITY === -->
      <section class="panel border border-helix-green p-6 shadow-glow fade-in">
        <h2 class="title">Идентификация полевого оператора</h2>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div><span class="label">Звание:</span> {{ auth.user?.role || 'БЕЗ ДОСТУПА' }}</div>
          <div><span class="label">Позывной:</span> {{ auth.user?.name || 'НЕИЗВЕСТЕН' }}</div>
          <div><span class="label">Подструктура:</span> D-13</div>
        </div>
      </section>

      <!-- === METRICS === -->
      <section class="panel border border-helix-green p-6 shadow-glow fade-in">
        <h2 class="title">Операционные метрики системы</h2>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
        ЦП:
        <span class="meter">
          <span class="bar" :style="{ width: cpuLoad + '%' }"></span>
        </span>
        ({{ cpuLoad }}%)
          </div>
          <div>
        Память:
        <span class="meter">
          <span class="bar bar-alt" :style="{ width: memLoad + '%' }"></span>
        </span>
        ({{ memLoad }}%)
          </div>
          <div>Сеть: ▲ {{ netUp }} ▼ {{ netDown }}</div>
        </div>
      </section>

      <!-- === FEED === -->
      <section class="panel border border-helix-green p-6 shadow-glow fade-in">
        <h2 class="title">Лента полевых отчётов</h2>

        <div v-if="posts.length === 0" class="text-helix-light mt-6 text-sm opacity-70">
          Нет доступных записей.
        </div>

        <div v-else class="space-y-8 mt-6">
          <div
            v-for="post in posts"
            :key="post.id"
            @click="open(post.id)"
            class="group cursor-pointer border border-helix-green/40 bg-black/20 backdrop-blur-sm 
                   hover:bg-helix-green/5 transition relative overflow-hidden rounded-md"
          >
            <!-- === МЕДИА === -->
            <div class="media-container relative mb-4">

              <!-- 🖼️ Изображение -->
              <template v-if="post.fileType && post.fileType.startsWith('image/')">
                <img
                  :src="backendUrl(post.coverImage)"
                  class="media-image cursor-zoom-in"
                  @click.stop="openZoom(backendUrl(post.coverImage))"
                />
                <p v-if="post.coverCaption" class="text-xs italic opacity-70 text-center mt-2">
                  {{ post.coverCaption }}
                </p>
              </template>

              <!-- 📄 Документ -->
              <template v-else-if="post.fileType && (
                post.fileType.startsWith('application/') ||
                ['pdf','doc','docx','txt','rtf','odt','xls','xlsx'].some(ext => post.fileType.includes(ext))
              )">
                <div class="doc-card text-center py-6 border border-helix-green/30 rounded-md bg-black/20" @click.stop>
                  <p class="text-sm mb-2 opacity-80">ПРИКРЕПЛЁННЫЙ ДОКУМЕНТ:</p>
                  <a
                    :href="backendUrl(post.coverImage)"
                    target="_blank"
                    class="inline-block border border-helix-green/40 px-3 py-1 text-xs rounded-sm hover:bg-helix-green/10 transition"
                  >
                    📄 ОТКРЫТЬ ФАЙЛ
                  </a>
                </div>
              </template>

              <!-- ❓ Fallback -->
              <template v-else-if="post.coverImage">
                <img
                  :src="backendUrl(post.coverImage)"
                  class="media-image cursor-zoom-in"
                  @click.stop="openZoom(backendUrl(post.coverImage))"
                />
              </template>
            </div>

            <!-- === Контент === -->
            <div class="p-4 space-y-2">
              <h3 class="font-bold text-helix-light tracking-wide group-hover:text-helix-green transition">
                {{ post.title }}
              </h3>

              <p class="text-sm opacity-75 line-clamp-3">
                {{ post.body }}
              </p>

              <div class="text-xs opacity-60 pt-2 flex justify-between">
                <span>Просмотров: {{ post.viewsCount || 0 }}</span>
                <span>{{ new Date(post.createdAt).toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- === ZOOM OVERLAY === -->
    <div
      v-if="zoomImage"
      class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
      @click="closeZoom"
    >
      <img
        :src="zoomImage"
        class="zoomed-image animate-zoom-in border border-helix-green/40 shadow-glow"
        @click.stop
      />
      <div class="absolute top-4 left-4 text-helix-green/70 text-xs tracking-wider">
        [ ВИЗУАЛЬНАЯ ЗАПИСЬ — РЕЖИМ УВЕЛИЧЕНИЯ ]
      </div>
      <button
        class="absolute top-4 right-4 text-helix-green hover:text-helix-light text-xs border border-helix-green/50 px-2 py-1"
        @click.stop="closeZoom"
      >
        [ ЗАКРЫТЬ ПРОСМОТР ]
      </button>
    </div>
  </div>
</template>

<script setup>
import { inject, ref, onMounted, onBeforeUnmount } from 'vue'
import api from '../services/api'
import { useRouter } from 'vue-router'
import { backendUrl } from '../services/env'

const auth = inject('auth')
const posts = ref([])
const router = useRouter()

const loadPosts = async () => {
  const res = await api.get('/posts')
  posts.value = res.data || []
}
onMounted(loadPosts)

const open = (id) => router.push(`/post/${id}`)

/* === Zoom === */
const zoomImage = ref(null)
const openZoom = (url) => (zoomImage.value = url)
const closeZoom = () => (zoomImage.value = null)

/* === Метрики === */
const netUp = ref('...')
const netDown = ref('...')
const cpuLoad = ref(37)
const memLoad = ref(55)

const animateMetrics = () => {
  cpuLoad.value = 30 + Math.round(Math.random() * 40)
  memLoad.value = 40 + Math.round(Math.random() * 30)
}
onMounted(() => setInterval(animateMetrics, 3000))

/* === Сеть === */
const measureNetworkSpeed = async () => {
  const url = `/static/ping.bin?cacheBust=${Date.now()}`
  const start = performance.now()
  const response = await fetch(url)
  const blob = await response.blob()
  const end = performance.now()

  const sizeBytes = blob.size
  const seconds = (end - start) / 1000
  const bitsPerSecond = (sizeBytes * 8) / seconds
  const kbps = bitsPerSecond / 1024

  netDown.value = kbps.toFixed(1) + ' kb/s'
  netUp.value = (kbps * 0.12).toFixed(1) + ' kb/s'
}
onMounted(() => {
  setInterval(measureNetworkSpeed, 5000)
  measureNetworkSpeed()
})

/* === PIXEL BACKGROUND === */
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
  pixels.forEach((p) => {
    ctx.fillStyle = `rgba(0,255,100,${p.alpha})`
    ctx.fillRect(p.x, p.y, p.size, p.size)
    p.y += p.speedY
    p.x += p.speedX
    if (Math.random() < 0.002) p.alpha = 1
    else if (p.alpha > 0.3) p.alpha -= 0.02
    if (p.y > h) p.y = 0
    if (p.x > w) p.x = 0
    if (p.x < 0) p.x = w
  })
  animFrame = requestAnimationFrame(draw)
}

/* === Glitch === */
const glitchLines = ref([])
const generateGlitch = () => {
  const phrases = [
    'ПОДКЛЮЧЕНИЕ К УЗЛУ_13...',
    'РАСШИФРОВКА СИГНАЛА...',
    'БИОПОДПИСЬ ОБНАРУЖЕНА',
    'ПРОТОКОЛ D-13 АКТИВЕН',
    '██ ФРАГМЕНТ ДАННЫХ ██',
    'УСТАНОВЛЕНИЕ МАРШРУТА ЗАВЕРШЕНО',
  ]
  glitchLines.value.push({
    id: Date.now(),
    text: phrases[Math.floor(Math.random() * phrases.length)],
    x: Math.random() * window.innerWidth * 0.9,
    y: Math.random() * window.innerHeight * 0.9,
  })
  setTimeout(() => glitchLines.value.shift(), 2000)
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
.media-container {
  position: relative;
  border: 1px solid rgba(0,255,150,0.3);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0,255,100,0.15);
  background: rgba(0,0,0,0.3);
}
.media-image {
  width: 100%;
  max-height: 380px;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease, filter 0.35s ease;
}
.media-image:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}
.doc-card {
  border-radius: 6px;
  box-shadow: inset 0 0 12px rgba(0,255,100,0.2), 0 0 8px rgba(0,255,100,0.3);
  transition: all 0.3s ease;
}
.doc-card:hover {
  background: rgba(0,255,100,0.05);
  transform: scale(1.02);
}
.pixel-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
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
  background: repeating-linear-gradient(rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 2px);
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
.hero { background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); text-shadow: 0 0 8px rgba(0,255,140,0.7); }
.hero-title { font-size: clamp(28px, 6vw, 58px); letter-spacing: 4px; text-transform: uppercase; }
.hero-subtitle.typing { margin-top: 12px; font-size: 14px; opacity: 0.85; animation: typing 4s steps(30, end) infinite alternate; white-space: nowrap; overflow: hidden; border-right: 2px solid rgba(0,255,100,0.5); }
@keyframes typing { 0% { width: 0ch; } 100% { width: 35ch; } }
.tag { border: 1px solid #00ff9d66; padding: 4px 10px; margin: 0 4px; font-size: 12px; opacity: 0.9; }
.panel { background: rgba(0, 0, 0, 0.699); backdrop-filter: blur(4px); }
.title { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; }
.label { opacity: 0.7; }
.meter {
  display: inline-block;
  width: 80px;
  height: 10px;
  border: 1px solid rgba(0,255,100,0.5);
  margin: 0 6px;
  position: relative;
  background: rgba(0,255,100,0.08);
}
.bar {
  display: block;
  height: 100%;
  background: rgba(0,255,120,0.7);
  box-shadow: 0 0 6px rgba(0,255,140,0.8);
  transition: width 1.4s ease;
}
.bar-alt {
  background: rgba(255,180,0,0.7);
  box-shadow: 0 0 6px rgba(255,200,50,0.9);
}
</style>
