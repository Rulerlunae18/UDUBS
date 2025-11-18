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
        [ МОНИТОРИНГ РЕАЛЬНЫХ ПОЛЬЗОВАТЕЛЕЙ ]
      </h1>

      <div v-if="loading" class="text-center opacity-70 py-10 text-green-300 animate-pulse">
        ЗАГРУЗКА ДАННЫХ ПОЛЬЗОВАТЕЛЕЙ...
      </div>

      <div
        v-else
        class="overflow-x-auto max-h-[70vh] overflow-y-auto border border-green-700 rounded-lg shadow-glow"
      >
        <table class="w-full text-sm border-collapse">
          <thead class="sticky top-0 bg-green-500/10 backdrop-blur-md">
            <tr>
              <th class="p-2 border border-green-600 uppercase">Имя пользователя</th>
              <th class="p-2 border border-green-600 uppercase">Пароль (UUID)</th>
              <th class="p-2 border border-green-600 uppercase">Последняя активность</th>
              <th class="p-2 border border-green-600 uppercase">Статус</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="u in users"
              :key="u.id"
              class="hover:bg-green-500/10 cursor-pointer transition-all"
            >
              <!-- Username -->
              <td class="p-2 border border-green-800">
                {{ u.username }}
              </td>

              <!-- UUID + кнопка копирования -->
              <td
                class="p-2 border border-green-800 text-xs opacity-80 font-mono flex justify-between items-center gap-2"
              >
                <span class="truncate w-[85%]">{{ u.password }}</span>
                <button
                  class="text-green-400/80 hover:text-green-200 text-[10px] border border-green-400/40 px-2 py-[2px] rounded tracking-wide"
                  @click.stop="copyUUID(u.password)"
                >
                  КОПИРОВАТЬ
                </button>
              </td>

              <!-- Last seen -->
              <td class="p-2 border border-green-800 text-sm">
                {{ formatDate(u.last_seen) }}
              </td>

              <!-- Online -->
              <td
                class="p-2 border border-green-800 text-center font-bold"
                :class="u.is_online ? 'text-green-400' : 'text-red-400'"
              >
                {{ u.is_online ? 'ОНЛАЙН' : 'ОФФЛАЙН' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, inject } from 'vue'
import axios from 'axios'

const pixelCanvas = ref(null)
let ctx, pixels = [], animFrame

const initPixels = () => {
  const w = (pixelCanvas.value.width = window.innerWidth)
  const h = (pixelCanvas.value.height = window.innerHeight)
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

  pixels.forEach((p) => {
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
    'КАНАЛ СВЯЗИ ГОТОВ',
    'МАРШРУТИЗАЦИЯ СИГНАЛА...',
    'ДОСТУП ПОДТВЕРЖДЁН',
    'ПРОТОКОЛ D-13 АКТИВЕН',
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

const users = ref([])
const loading = ref(true)
const socket = inject('socket')

const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—')

const copyUUID = async (uuid) => {
  try {
    await navigator.clipboard.writeText(uuid)
    console.log(`📋 UUID скопирован: ${uuid}`)
  } catch (e) {
    console.warn('⚠️ Ошибка буфера обмена:', e)
  }
}

/* === FETCH DATA === */
const fetchUsers = async () => {
  const endpoint = import.meta.env.VITE_BACKEND_URL + '/api/realusers'
  console.log('📡 [RealUsers] Запрос к серверу:', endpoint)

  try {
    const { data } = await axios.get(endpoint)
    console.log(`✅ [RealUsers] Получено ${data.length} пользователей`, data)
    users.value = data
  } catch (e) {
    console.error('❌ [RealUsers] Ошибка при загрузке:', e.message)
    if (e.response) {
      console.error('📦 Сервер ответил:', e.response.status, e.response.data)
    } else if (e.request) {
      console.warn('🚫 Сервер не ответил. Возможно, неверный URL или CORS.')
    }
  } finally {
    loading.value = false
  }
}

/* === AUTO REFRESH + SOCKET === */
onMounted(() => {
  console.log('🟢 [RealUsers] Компонент смонтирован — начинаем загрузку.')
  fetchUsers()

  const refresh = setInterval(() => {
    console.log('🔁 [RealUsers] Автообновление списка...')
    fetchUsers()
  }, 10000)

  socket?.on('onlineUsersUpdate', (list) => {
    console.log('⚡ [Socket] Обновление онлайна:', list)
    users.value.forEach((u) => {
      u.is_online = list.some((r) => r.id === u.id)
    })
  })

  onBeforeUnmount(() => {
    clearInterval(refresh)
    console.log('🔴 [RealUsers] Компонент размонтирован — обновления остановлены.')
  })
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
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background: #00ff8855;
  border-radius: 8px;
}
::-webkit-scrollbar-thumb:hover {
  background: #00ff88aa;
}

/* === Helix CRT Background === */
.pixel-canvas,
.crt,
.scanline {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.pixel-canvas {
  opacity: 0.35;
  mix-blend-mode: lighten;
}
.crt {
  background: repeating-linear-gradient(
    rgba(0, 0, 0, 0.18) 0px,
    rgba(0, 0, 0, 0.18) 1px,
    transparent 2px
  );
  mix-blend-mode: screen;
}
.scanline {
  height: 20%;
  background: linear-gradient(to bottom, transparent, rgba(0, 255, 100, 0.15), transparent);
  animation: scan 6s linear infinite;
}
@keyframes scan {
  0% {
    top: -20%;
  }
  100% {
    top: 120%;
  }
}

.glitch-line {
  position: fixed;
  font-size: 12px;
  opacity: 0.65;
  color: rgba(0, 255, 100, 0.75);
  text-shadow: 0 0 6px rgba(0, 255, 150, 0.6);
  animation: glitchFade 2s ease-out forwards;
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
