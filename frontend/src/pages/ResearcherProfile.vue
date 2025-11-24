<template>
  <div class="relative min-h-screen bg-helix-dark text-helix-green font-mono overflow-hidden">
    <!-- === ФОНОВЫЙ ЭФФЕКТ === -->
    <div class="crt"></div>
    <canvas ref="pixelCanvas" class="pixel-canvas"></canvas>
    <div class="scanline"></div>

    <!-- === СТРОКИ ГЛИТЧА === -->
    <div
      v-for="line in glitchLines"
      :key="line.id"
      class="glitch-line"
      :style="{ top: line.y + 'px', left: line.x + 'px' }"
    >
      {{ line.text }}
    </div>

    <!-- === ОСНОВНОЙ КОНТЕНТ === -->
    <div class="relative z-10 max-w-4xl mx-auto p-8">
      <h1
        class="text-2xl text-center mb-8 tracking-wider drop-shadow-[0_0_10px_rgba(0,255,150,0.6)] text-helix-light"
      >
        [ ПРОФИЛЬ ИССЛЕДОВАТЕЛЯ ]
      </h1>

      <div v-if="loading" class="text-center opacity-70">
        ЗАГРУЗКА ДАННЫХ ПЕРСОНАЛА...
      </div>

      <div v-else-if="researcher" class="text-center space-y-4 fade-in">
        <img
          :src="researcher.avatarUrl ? backendUrl(researcher.avatarUrl) : '/default-avatar.png'"
          alt="avatar"
          class="w-32 h-32 object-cover rounded-full border border-helix-green/60 shadow-glow mx-auto"
        />

        <h2 class="text-xl font-bold text-helix-light mt-4">
          {{ researcher.codename }}
        </h2>

        <p class="opacity-80">
          {{ researcher.rank || 'Исследователь' }}
        </p>

        <p v-if="researcher.clearance" class="text-sm opacity-60">
          Уровень допуска: {{ researcher.clearance }}
        </p>

        <p
          class="text-xs opacity-80 border-t border-helix-green/30 pt-3 mt-4 leading-snug text-left"
        >
          {{ researcher.bio || 'Биография не найдена.' }}
        </p>

        <!-- === РАЗДЕЛ ПОСТОВ === -->
        <div class="border-t border-helix-green/30 mt-8 pt-6 text-left">
          <h3 class="text-lg mb-4 tracking-widest text-center text-helix-light">
            [ ЖУРНАЛЫ ИССЛЕДОВАНИЙ ]
          </h3>

          <div v-if="posts.length">
            <div
              v-for="post in posts"
              :key="post.id"
              class="mb-6 border border-helix-green/40 rounded-xl p-4 bg-black/50 backdrop-blur-sm hover:bg-helix-green/5 transition"
            >
              <router-link
                :to="`/post/${post.id}`"
                class="text-helix-green font-bold text-lg hover:text-helix-light transition"
              >
                {{ post.title }}
              </router-link>
              <p class="opacity-70 text-xs mt-1">
                {{ new Date(post.createdAt).toLocaleString('ru-RU') }}
              </p>
              <p class="opacity-90 text-sm mt-2 leading-relaxed">
                {{ post.body.slice(0, 220) }}
                <span v-if="post.body.length > 220">...</span>
              </p>
            </div>
          </div>
          <p v-else class="text-center opacity-60 text-sm">
            Журналы исследований недоступны.
          </p>
        </div>
      </div>

      <div v-else class="text-center opacity-70">
        ИССЛЕДОВАТЕЛЬ НЕ НАЙДЕН.
      </div>

      <button
        @click="$router.push('/fake-users')"
        class="mt-10 border border-helix-green px-4 py-2 hover:bg-helix-green/10 transition"
      >
        ← ВЕРНУТЬСЯ К СПРАВОЧНИКУ
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import { backendUrl } from '../services/env'

const route = useRoute()
const researcher = ref(null)
const posts = ref([])
const loading = ref(true)

/* === Загрузка профиля и постов === */
const loadResearcher = async () => {
  try {
    const res = await api.get(`/fakeusers/${route.params.id}`)
    researcher.value = res.data

    const postsRes = await api.get(`/fakeusers/${route.params.id}/posts`)
    posts.value = postsRes.data.posts || []
  } catch (err) {
    console.error('Ошибка загрузки профиля:', err)
  } finally {
    loading.value = false
  }
}

/* === ПИКСЕЛЬНЫЙ ФОНОВЫЙ ЭФФЕКТ === */
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

/* === ЭФФЕКТ ГЛИТЧА === */
const glitchLines = ref([])
const generateGlitch = () => {
  const lines = [
    'ДОСТУП К ФАЙЛУ СОТРУДНИКА...',
    'УЗЕЛ ТРАССИРОВКИ: СТАБИЛЕН',
    'КАНАЛ СВЯЗИ ГОТОВ',
    'СИГНАЛ ПРОВЕРЕН'
  ]
  glitchLines.value.push({
    id: Date.now(),
    text: lines[Math.floor(Math.random() * lines.length)],
    x: Math.random() * window.innerWidth * 0.8,
    y: Math.random() * window.innerHeight * 0.8,
  })
  setTimeout(() => glitchLines.value.shift(), 1600)
}

onMounted(() => {
  loadResearcher()
  ctx = pixelCanvas.value.getContext('2d')
  initPixels()
  draw()
  glitchTimer = setInterval(generateGlitch, 1600)
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

.shadow-glow {
  box-shadow: 0 0 10px rgba(0, 255, 150, 0.5);
}
</style>
