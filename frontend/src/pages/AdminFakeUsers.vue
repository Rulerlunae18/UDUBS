<template>
  <div class="min-h-screen bg-helix-dark text-green-400 font-mono relative overflow-hidden">
    <!-- === CRT / PIXEL BACKGROUND === -->
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
    <div class="relative z-10 max-w-6xl mx-auto p-8">
      <h1 class="text-2xl text-center mb-10 tracking-[0.25em] text-green-400 drop-shadow-[0_0_10px_rgba(0,255,150,0.6)] uppercase">
        [ БАЗА ДАННЫХ ПЕРСОНАЛА / ДОСТУП К ИССЛЕДОВАТЕЛЬСКОМУ ЦЕНТРУ ]
      </h1>

      <!-- 🟢 Форма добавления -->
      <form
        @submit.prevent="createFakeUser"
        class="border border-green-500 p-6 bg-black/60 backdrop-blur-sm shadow-glow rounded-md space-y-4 mb-12 relative overflow-hidden"
      >
        <div class="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/40 to-transparent"></div>
        <h2 class="text-lg font-bold mb-3 text-green-300 uppercase tracking-wide">
          СОЗДАТЬ ПРОФИЛЬ ИССЛЕДОВАТЕЛЯ
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm opacity-70 mb-1">Кодовое имя</label>
            <input v-model="form.codename" class="input-field" placeholder="Что угодно" />
          </div>
          <div>
            <label class="block text-sm opacity-70 mb-1">Звание</label>
            <input v-model="form.rank" class="input-field" placeholder="Исследователь / Надзиратель" />
          </div>
          <div>
            <label class="block text-sm opacity-70 mb-1">Уровень допуска</label>
            <input v-model="form.clearance" class="input-field" placeholder="Что-угодно, моя бусинка" />
          </div>
        </div>

        <div>
          <label class="block text-sm opacity-70 mb-1">Биография / Заметки</label>
          <textarea
            v-model="form.bio"
            rows="3"
            class="input-field resize-none"
            placeholder="Исследовательская направленность, заметки или внутренний журнал..."
          ></textarea>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm opacity-70 mb-1">Загрузка аватара</label>
            <input
              type="file"
              @change="handleFileUpload"
              class="block w-full text-sm bg-black border border-green-500 file:bg-green-500/10 file:text-green-300 file:px-3 file:py-1 file:border-none"
              accept="image/*"
            />
          </div>
          <div v-if="preview" class="flex justify-center items-center">
            <img
              :src="preview"
              alt="preview"
              class="w-24 h-24 object-cover rounded-full border border-green-500 shadow-glow"
            />
          </div>
        </div>

        <button
          type="submit"
          class="mt-5 w-full border border-green-400 py-2 hover:bg-green-400/10 transition-all font-bold tracking-widest uppercase"
        >
          + Добавить исследователя
        </button>
      </form>

      <!-- 🧠 Список учёных -->
      <div v-if="loading" class="text-center opacity-70 animate-pulse">
        Загрузка записей персонала...
      </div>

      <div
        v-else-if="fakeUsers.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <div
          v-for="user in fakeUsers"
          :key="user.id"
          class="research-card border border-green-500 bg-black/50 rounded-md shadow-glow overflow-hidden relative group"
        >
          <div class="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/40 to-transparent"></div>

          <div class="p-5 flex flex-col items-center text-center relative">
            <div
              class="w-24 h-24 rounded-full border border-green-400 overflow-hidden shadow-glow mb-3 group-hover:scale-105 transition"
            >
              <img
                :src="user.avatarUrl ? backendUrl(user.avatarUrl) : '/default-avatar.png'"
                alt="avatar"
                class="w-full h-full object-cover"
              />
            </div>

            <div class="w-20 h-4 overflow-hidden mb-3">
              <div class="pulse-line"></div>
            </div>

            <h3 class="font-bold text-lg text-green-300 tracking-wide uppercase">
              {{ user.codename }}
            </h3>
            <p class="text-sm opacity-80">{{ user.rank || 'Исследователь' }}</p>
            <p class="text-xs opacity-70 mt-2 border-t border-green-400/30 pt-2 leading-snug italic">
              {{ user.bio || 'Записи отсутствуют.' }}
            </p>
            <p class="text-xs opacity-60 mt-2 font-semibold">
              Уровень допуска: {{ user.clearance || 'Н/Д' }}
            </p>

            <button
              @click="deleteFakeUser(user.id)"
              class="mt-4 text-red-400 border border-red-400 px-3 py-1 hover:bg-red-400/10 transition-all uppercase text-xs tracking-wider"
            >
              Удалить запись
            </button>
          </div>

          <div class="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-green-500/40 to-transparent"></div>
        </div>
      </div>

      <div v-else class="text-center opacity-70 mt-10">Записи персонала не найдены.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import api from '../services/api'
import { backendUrl } from '../services/env'

const fakeUsers = ref([])
const loading = ref(true)
const preview = ref(null)
const form = ref({
  codename: '',
  rank: '',
  clearance: '',
  bio: '',
  avatarUrl: null
})

/* === PIXEL BACKGROUND === */
const pixelCanvas = ref(null)
let ctx, pixels = [], animFrame
const glitchLines = ref([])

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

const generateGlitch = () => {
  const words = [
    "СИНХРОНИЗАЦИЯ ФАЙЛОВ ПЕРСОНАЛА...",
    "УЗЕЛ ДОСТУПА: БД_ИССЛЕДОВАТЕЛЕЙ",
    "ПОТОК ДАННЫХ: СТАБИЛЕН",
    "КАНАЛ СВЯЗИ ПОДТВЕРЖДЕН"
  ]
  glitchLines.value.push({
    id: Date.now(),
    text: words[Math.floor(Math.random() * words.length)],
    x: Math.random() * window.innerWidth * 0.8,
    y: Math.random() * window.innerHeight * 0.8,
  })
  setTimeout(() => glitchLines.value.shift(), 1600)
}

/* === API === */
const loadFakeUsers = async () => {
  try {
    const res = await api.get('/fakeusers')
    fakeUsers.value = res.data || []
  } finally {
    loading.value = false
  }
}
const handleFileUpload = e => {
  const file = e.target.files[0]
  if (file) {
    form.value.avatarUrl = file
    preview.value = URL.createObjectURL(file)
  }
}

const createFakeUser = async () => {
  try {
    const fd = new FormData()
    fd.append('codename', form.value.codename)
    fd.append('rank', form.value.rank)
    fd.append('clearance', form.value.clearance)
    fd.append('bio', form.value.bio)

    if (form.value.avatarUrl) {
      fd.append('avatar', form.value.avatarUrl)
    }

    await api.post('/fakeusers', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    await loadFakeUsers()

    // reset form
    Object.assign(form.value, {
      codename: '',
      rank: '',
      clearance: '',
      bio: '',
      avatarUrl: null
    })
    preview.value = null

  } catch (err) {
    console.error('Ошибка создания NPC:', err)
  }
}

const updateFakeUser = async user => {
  const fd = new FormData()
  fd.append('codename', user.codename)
  fd.append('rank', user.rank)
  fd.append('clearance', user.clearance)
  fd.append('bio', user.bio)

  if (avatarFile.value) {
    fd.append('avatar', avatarFile.value)
  }

  await api.put(`/fakeusers/${user.id}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

  await loadFakeUsers()
}

const deleteFakeUser = async id => {
  if (!confirm('Удалить этого исследователя?')) return
  await api.delete(`/fakeusers/${id}`)
  fakeUsers.value = fakeUsers.value.filter(u => u.id !== id)
}

onMounted(() => {
  loadFakeUsers()
  ctx = pixelCanvas.value.getContext('2d')
  initPixels()
  draw()
  setInterval(generateGlitch, 1400)
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
.crt {
  pointer-events: none;
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 2px);
  mix-blend-mode: screen;
  z-index: 1;
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
@keyframes scan { 0% { top: -20%; } 100% { top: 120%; } }
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

.input-field {
  @apply w-full p-2 bg-black border border-green-500 text-green-300 
         focus:ring-1 focus:ring-green-400 
         transition-all duration-200 ease-in-out;
}
.shadow-glow { box-shadow: 0 0 10px rgba(0,255,150,0.4); }
.research-card { transition: all 0.3s ease; }
.research-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 15px rgba(0,255,100,0.5);
}

/* Пульс-линия */
.pulse-line {
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(90deg, transparent 0, transparent 10px, rgba(0,255,150,0.7) 12px, transparent 14px);
  animation: pulseMove 1s linear infinite;
  box-shadow: 0 0 8px rgba(0,255,150,0.5);
}
@keyframes pulseMove {
  from { background-position: 0 0; }
  to { background-position: 100% 0; }
}
</style>
