<template>
  <div class="relative min-h-screen bg-black text-green-400 font-mono overflow-hidden">
    <!-- === CRT / PIXEL BACKGROUND === -->
    <div class="crt"></div>
    <canvas ref="pixelCanvas" class="pixel-canvas"></canvas>
    <div class="scanline"></div>

    <!-- Glitch text overlay -->
    <div
      v-for="line in glitchLines"
      :key="line.id"
      class="glitch-line"
      :style="{ top: line.y + 'px', left: line.x + 'px' }"
    >
      {{ line.text }}
    </div>

    <!-- === MAIN CONTENT === -->
    <div class="relative z-10 max-w-7xl mx-auto p-6 fade-in">
      <h1
        class="text-2xl text-center mb-8 tracking-widest text-green-400 drop-shadow-[0_0_10px_rgba(0,255,150,0.6)] uppercase"
      >
        [ УПРАВЛЕНИЕ ТЕЛЕМЕТРИЕЙ АДМИНИСТРАТОРА / ИГРОКА ]
      </h1>

      <!-- not admin -->
      <div v-if="!isAdmin" class="text-center mt-20 opacity-70 text-red-400">
        ⚠️ ДОСТУП ЗАПРЕЩЁН — ТРЕБУЮТСЯ ПРИВИЛЕГИИ АДМИНИСТРАТОРА
      </div>

      <!-- admin -->
      <div v-else>
        <div class="flex justify-between items-center mb-4">
          <input
            v-model="searchQuery"
            placeholder="Ищи, золотце, по айди, нику и стране..."
            class="w-full max-w-md p-2 bg-black/70 border border-green-500 focus:ring-2 focus:ring-green-400 outline-none placeholder-green-600"
          />
          <span class="text-xs text-green-300 opacity-70">
            Последнее обновление: {{ formatDate(lastRefresh) }}
          </span>
        </div>

        <div v-if="loading" class="text-center opacity-60 py-10 text-green-300 animate-pulse">
          ЗАГРУЗКА ДАННЫХ ИГРОКА...
        </div>

        <div
          v-else
          class="overflow-x-auto max-h-[70vh] overflow-y-auto border border-green-700 rounded-lg shadow-glow"
        >
          <table class="w-full text-sm border-collapse">
            <thead class="sticky top-0 bg-green-500/10 backdrop-blur-md">
              <tr>
                <th v-for="col in columns" :key="col" class="p-2 border border-green-600 uppercase">
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in filteredProfiles"
                :key="p.id"
                :class="[
                  'hover:bg-green-500/10 cursor-pointer transition-all',
                  p._flash ? 'bg-green-400/10 shadow-[0_0_10px_#00ff88_inset]' : ''
                ]"
                @click="selectProfile(p)"
              >
                <td class="p-2 border border-green-800">{{ p.username }}</td>
                <td class="p-2 border border-green-800 text-xs opacity-70">{{ p.playerId }}</td>
                <td class="p-2 border border-green-800">{{ p.platform }}</td>
                <td class="p-2 border border-green-800">{{ p.country || '—' }}</td>
                <td class="p-2 border border-green-800">{{ p.city || '—' }}</td>
                <td class="p-2 border border-green-800">{{ p.total_playtime ?? 0 }}</td>
                <td class="p-2 border border-green-800">
                  <span :class="p.safe_mode ? 'text-green-400' : 'text-red-400'">
                    {{ p.safe_mode ? 'ON' : 'OFF' }}
                  </span>
                </td>
                <td class="p-2 border border-green-800">{{ formatDate(p.collected_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- === ВСПЛЫВАЮЩЕЕ ОКНО ДЕТАЛЕЙ ИГРОКА === -->
    <transition name="fade">
      <div
        v-if="selected"
        class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm"
      >
        <div
          class="bg-black border border-green-400 p-6 max-w-3xl w-full mx-4 text-green-400 shadow-glow overflow-y-auto max-h-[85vh] rounded-lg"
        >
          <h2 class="text-xl mb-4 text-center uppercase">
            [ ПРОФИЛЬ ИГРОКА: {{ selected.username }} ]
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm leading-relaxed">
            <!-- GENERAL -->
            <h3 class="col-span-2 text-green-300 mt-2 mb-1">📦 ОБЩЕЕ</h3>
            <p><b>ID:</b> {{ selected.playerId }}</p>
            <p><b>Platform:</b> {{ selected.platform }}</p>
            <p><b>System Lang:</b> {{ selected.system_lang }}</p>
            <p><b>IP:</b> {{ selected.ip }}</p>
            <p><b>City:</b> {{ selected.city }}</p>
            <p><b>Country:</b> {{ selected.country }}</p>
            <p><b>Collected At:</b> {{ formatDate(selected.collected_at) }}</p>

            <!-- GAME -->
            <h3 class="col-span-2 text-green-300 mt-4 mb-1">🎮 GAME STATS</h3>
            <p><b>Session Time:</b> {{ selected.session_time }}s</p>
            <p><b>Total Playtime:</b> {{ selected.total_playtime }}s</p>
            <p><b>Safe Mode:</b> {{ selected.safe_mode ? 'ON' : 'OFF' }}</p>
            <p><b>Opened Game:</b> {{ selected.opened_game ? '✔' : '✖' }}</p>
            <p><b>First Playthrough:</b> {{ selected.first_playthrough_done ? '✔' : '✖' }}</p>

            <!-- STORY -->
            <h3 class="col-span-2 text-green-300 mt-4 mb-1">🧠 STORY FLAGS</h3>
            <p><b>Silvair Rickroll:</b> {{ selected.silvair_rickroll }}</p>
            <p><b>Scarlett Taunts:</b> {{ selected.scarlett_taunts }}</p>
            <p><b>Kassi Named:</b> {{ selected.kassi_named }}</p>
            <p><b>Kassi Said:</b> {{ selected.kassi_said }}</p>
            <p><b>Kassi Stage 1:</b> {{ selected.kassi_1 }}</p>
            <p><b>Kassi Stage 2:</b> {{ selected.kassi_2 }}</p>
            <p><b>Kassi Stage 3:</b> {{ selected.kassi_3 }}</p>
            <p><b>Kassi Stage 4:</b> {{ selected.kassi_4 }}</p>
          </div>

          <div class="text-center mt-6">
            <button
              @click="selected = null"
              class="border border-green-400 px-4 py-1 hover:bg-green-500/20 transition-all"
            >
              [ ЗАКРЫТЬ ]
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount, computed, inject } from 'vue'
import { getAllProfiles } from '../services/api'
import { io } from 'socket.io-client'
import { backendUrl } from '../services/env'

const auth = inject('auth', { user: { role: 'USER' } })
const isAdmin = computed(() => auth.user?.role === 'ADMIN')

const profiles = ref([])
const loading = ref(true)
const selected = ref(null)
const searchQuery = ref('')
const lastRefresh = ref(null)
let socket = null
let refreshInterval = null

const columns = ['Username', 'ID', 'Platform', 'Country', 'City', 'Playtime', 'Safe Mode', 'Collected']

const formatDate = (d) => (!d ? '—' : new Date(d).toLocaleString())

const filteredProfiles = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return profiles.value.filter(p =>
    [p.username, p.id, p.country].some(v => v?.toLowerCase().includes(q))
  )
})

const selectProfile = (p) => (selected.value = p)

async function loadProfiles() {
  try {
    const data = await getAllProfiles()
    profiles.value = data
    lastRefresh.value = new Date()
  } catch (err) {
    console.warn('⚠️ Error loading profiles:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!isAdmin.value) return
  await loadProfiles()

  // 🛰 WebSocket updates
  socket = io(backendUrl(''), { withCredentials: true })
  socket.on('playerUpdate', (data) => {
    const existing = profiles.value.find(p => p.id === data.id)
    if (existing) Object.assign(existing, data)
    else profiles.value.push(data)
  })

  // 🔁 Auto-refresh every 60s
  refreshInterval = setInterval(async () => {
    console.log('🔄 Auto-refreshing player list...')
    await loadProfiles()
  }, 60000)
})

onUnmounted(() => {
  if (socket) socket.disconnect()
  if (refreshInterval) clearInterval(refreshInterval)
})

/* === HELIX BACKGROUND ANIMATION === */
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
    "КАНАЛ СВЯЗИ ГОТОВ",
    "МАРШРУТИЗАЦИЯ СИГНАЛА...",
    "ДОСТУП ПОДТВЕРЖДЁН",
    "ПРОТОКОЛ D-13 АКТИВЕН",
    "РЕЛЕ ПОДКЛЮЧЕНО",
    "БЛОКИРОВКА ПОТОКА: ОК"
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
.shadow-glow {
  box-shadow: 0 0 10px #00ff88, inset 0 0 10px #006644;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: #00ff8855; border-radius: 8px; }
::-webkit-scrollbar-thumb:hover { background: #00ff88aa; }

/* === Helix CRT Background === */
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
