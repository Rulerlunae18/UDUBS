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
    <section class="hero relative z-10 border-b border-helix-green/60 py-16 px-6 text-center fade-in">
      <p class="text-[11px] tracking-[0.4em] opacity-60 mb-4">// ЗАЩИЩЁННЫЙ КАНАЛ · УРОВЕНЬ ДОПУСКА ПОДТВЕРЖДЁН</p>

      <h1 class="hero-title">
        ИССЛЕДОВАТЕЛЬСКАЯ СЕТЬ OBDUBS-09
      </h1>

      <p class="hero-subtitle typing">
        ДОСТУП К МАРШРУТИЗАЦИИ... УСТАНОВКА ПОЛЕВОЙ СВЯЗИ...
      </p>

      <div class="hero-info mt-8 flex flex-wrap justify-center gap-3">
        <span class="tag">Оператор: {{ auth.user?.name || 'НЕИЗВЕСТЕН' }}</span>
        <span class="tag">Допуск: {{ auth.user?.role || 'БЕЗ ДОСТУПА' }}</span>
        <span class="tag">Подструктура: D-13</span>
      </div>
    </section>

    <!-- === MAIN === -->
    <main class="relative z-10 p-6 md:p-12 space-y-8 max-w-6xl mx-auto">

      <!-- === IDENTITY + METRICS === -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in">
        <section class="panel frame p-6">
          <h2 class="title">Идентификация полевого оператора</h2>
          <dl class="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt class="label">Звание</dt>
              <dd class="mt-1">{{ auth.user?.role || 'БЕЗ ДОСТУПА' }}</dd>
            </div>
            <div>
              <dt class="label">Позывной</dt>
              <dd class="mt-1">{{ auth.user?.name || 'НЕИЗВЕСТЕН' }}</dd>
            </div>
            <div>
              <dt class="label">Подструктура</dt>
              <dd class="mt-1">D-13</dd>
            </div>
          </dl>
        </section>

        <section class="panel frame p-6">
          <h2 class="title">Операционные метрики системы</h2>
          <div class="mt-5 space-y-3 text-sm">
            <div class="metric-row">
              <span class="label w-16">ЦП</span>
              <span class="meter"><span class="bar" :style="{ width: cpuLoad + '%' }"></span></span>
              <span class="w-12 text-right">{{ cpuLoad }}%</span>
            </div>
            <div class="metric-row">
              <span class="label w-16">Память</span>
              <span class="meter"><span class="bar bar-alt" :style="{ width: memLoad + '%' }"></span></span>
              <span class="w-12 text-right">{{ memLoad }}%</span>
            </div>
            <div class="metric-row">
              <span class="label w-16">Сеть</span>
              <span class="text-xs">▲ {{ netUp }} &nbsp; ▼ {{ netDown }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- === FEED === -->
      <section class="fade-in">
        <div class="flex items-end justify-between mb-6 border-b border-helix-green/30 pb-3">
          <h2 class="feed-heading">Лента полевых отчётов</h2>
          <span class="text-xs opacity-60">ЗАПИСЕЙ: {{ posts.length }}</span>
        </div>

        <div v-if="posts.length === 0" class="panel frame p-10 text-center text-sm opacity-70">
          Нет доступных записей.
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article
            v-for="post in posts"
            :key="post.id"
            @click="open(post.id)"
            class="report-card group"
          >
            <!-- === МЕДИА === -->
            <div class="media-wrap">
              <!-- 🖼️ Изображение -->
              <template v-if="post.fileType && post.fileType.startsWith('image/')">
                <img
                  :src="backendUrl(post.coverImage)"
                  class="media-image cursor-zoom-in"
                  loading="lazy"
                  @click.stop="openZoom(backendUrl(post.coverImage))"
                />
              </template>

              <!-- 📄 Документ -->
              <template v-else-if="post.fileType && (
                post.fileType.startsWith('application/') ||
                ['pdf','doc','docx','txt','rtf','odt','xls','xlsx'].some(ext => post.fileType.includes(ext))
              )">
                <div class="doc-card" @click.stop>
                  <span class="text-3xl" aria-hidden="true">📄</span>
                  <p class="text-xs opacity-70 mt-2 tracking-wider">ПРИКРЕПЛЁННЫЙ ДОКУМЕНТ</p>
                  <a
                    :href="backendUrl(post.coverImage)"
                    target="_blank"
                    class="doc-link"
                  >
                    ОТКРЫТЬ ФАЙЛ →
                  </a>
                </div>
              </template>

              <!-- ❓ Fallback -->
              <template v-else-if="post.coverImage">
                <img
                  :src="backendUrl(post.coverImage)"
                  class="media-image cursor-zoom-in"
                  loading="lazy"
                  @click.stop="openZoom(backendUrl(post.coverImage))"
                />
              </template>

              <div v-else class="media-empty">
                <span class="opacity-40 text-xs tracking-widest">БЕЗ ВИЗУАЛЬНОЙ ЗАПИСИ</span>
              </div>

              <!-- бейджи поверх медиа -->
              <div class="badges">
                <span v-if="post.fileType" class="badge">{{ fileLabel(post.fileType) }}</span>
                <span v-if="post.clearance" class="badge badge-amber">ДОПУСК {{ post.clearance }}</span>
              </div>
            </div>

            <!-- === Контент === -->
            <div class="p-5 flex flex-col flex-1">
              <h3 class="report-title">
                {{ post.title }}
              </h3>

              <p v-if="post.coverCaption" class="text-xs italic opacity-60 mt-1">
                {{ post.coverCaption }}
              </p>

              <p class="text-sm opacity-80 leading-relaxed mt-3 line-clamp-3">
                {{ post.body }}
              </p>

              <div class="meta mt-auto pt-5">
                <span>{{ new Date(post.createdAt).toLocaleString() }}</span>
                <span>ПРОСМОТРОВ: {{ post.viewsCount || 0 }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>

    <!-- === ZOOM OVERLAY === -->
    <div
      v-if="zoomImage"
      class="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6"
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
  posts.value = Array.isArray(res.data) ? res.data : []
}
onMounted(loadPosts)

const open = (id) => router.push(`/post/${id}`)

/* === Подпись типа файла для бейджа === */
const fileLabel = (type) => {
  const t = String(type).toLowerCase()
  if (t.startsWith('image/')) return 'ИЗОБРАЖЕНИЕ'
  if (t.includes('pdf')) return 'PDF'
  if (t.includes('word') || t.includes('docx') || t.includes('doc')) return 'DOC'
  if (t.includes('sheet') || t.includes('xls')) return 'XLS'
  if (t.includes('text') || t.includes('txt')) return 'TXT'
  return t.split('/').pop().toUpperCase().slice(0, 8)
}

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
  const url = backendUrl(`/static/ping.bin?cacheBust=${Date.now()}`)
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
/* ---------- HERO ---------- */
.hero {
  background: linear-gradient(180deg, rgba(0,255,150,0.06), rgba(0,0,0,0.5));
  backdrop-filter: blur(4px);
  text-shadow: 0 0 8px rgba(0,255,140,0.7);
}
.hero-title {
  font-size: clamp(28px, 6vw, 58px);
  letter-spacing: 4px;
  text-transform: uppercase;
  line-height: 1.1;
}
.hero-subtitle.typing {
  margin-top: 14px;
  font-size: 14px;
  opacity: 0.85;
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid rgba(0,255,100,0.5);
  animation: typing 4s steps(30, end) infinite alternate;
}
@keyframes typing { 0% { width: 0ch; } 100% { width: 35ch; } }

.tag {
  border: 1px solid rgba(0,255,157,0.45);
  background: rgba(0,0,0,0.35);
  padding: 4px 12px;
  font-size: 12px;
  letter-spacing: 1px;
}

/* ---------- PANELS ---------- */
.panel {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}
.frame {
  position: relative;
  border: 1px solid rgba(0,255,153,0.5);
  box-shadow: 0 0 12px rgba(0,255,153,0.12);
}
/* уголки-«скобки» для терминального вида */
.frame::before,
.frame::after {
  content: "";
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: #00ff99;
  border-style: solid;
  pointer-events: none;
}
.frame::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
.frame::after  { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

.title {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 0.9;
}
.label { opacity: 0.6; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }

.metric-row { display: flex; align-items: center; gap: 12px; }
.meter {
  flex: 1;
  height: 10px;
  border: 1px solid rgba(0,255,100,0.5);
  background: rgba(0,255,100,0.08);
  position: relative;
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

/* ---------- FEED ---------- */
.feed-heading {
  font-size: 18px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #aaffcc;
  text-shadow: 0 0 8px rgba(0,255,153,0.6);
}

.report-card {
  position: relative;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(0,255,153,0.35);
  border-radius: 6px;
  overflow: hidden;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.report-card:hover {
  transform: translateY(-3px);
  border-color: rgba(0,255,153,0.9);
  box-shadow: 0 0 18px rgba(0,255,153,0.25);
}

.media-wrap {
  position: relative;
  aspect-ratio: 16 / 10;
  background: rgba(0,0,0,0.5);
  border-bottom: 1px solid rgba(0,255,153,0.25);
  overflow: hidden;
}
.media-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease, filter 0.4s ease;
}
.report-card:hover .media-image {
  transform: scale(1.04);
  filter: brightness(1.1) saturate(1.1);
}
/* лёгкое затемнение снизу, чтобы бейджи читались */
.media-wrap::after {
  content: "";
  position: absolute;
  inset: auto 0 0 0;
  height: 40%;
  background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
  pointer-events: none;
}

.media-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    repeating-linear-gradient(45deg, rgba(0,255,153,0.04) 0 10px, transparent 10px 20px);
}

.doc-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px;
}
.doc-link {
  margin-top: 10px;
  border: 1px solid rgba(0,255,153,0.5);
  padding: 6px 14px;
  font-size: 12px;
  letter-spacing: 1px;
  transition: background 0.2s ease, color 0.2s ease;
}
.doc-link:hover {
  background: #00ff99;
  color: #050805;
}

.badges {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  z-index: 2;
}
.badge {
  font-size: 10px;
  letter-spacing: 1px;
  padding: 2px 8px;
  background: rgba(0,0,0,0.7);
  border: 1px solid rgba(0,255,153,0.6);
  color: #aaffcc;
}
.badge-amber {
  border-color: rgba(255,227,122,0.7);
  color: #ffe37a;
}

.report-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
  line-height: 1.3;
  color: #aaffcc;
  transition: color 0.2s ease;
}
.report-card:hover .report-title {
  color: #00ff99;
}

.meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  opacity: 0.6;
  border-top: 1px dashed rgba(0,255,153,0.25);
  padding-top: 10px;
}

/* ---------- ZOOM ---------- */
.zoomed-image {
  max-width: 92vw;
  max-height: 88vh;
  object-fit: contain;
  animation: zoom-in 0.25s ease-out;
}
@keyframes zoom-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

/* ---------- BACKGROUND FX ---------- */
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
  z-index: 2;
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
