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
        [ ФАЙЛЫ ИССЛЕДОВАНИЙ / БАЗА ДАННЫХ ДОКУМЕНТОВ ]
      </h1>

      <div v-if="loading" class="text-center opacity-60">СКАНИРОВАНИЕ ХРАНИЛИЩА ДОКУМЕНТОВ...</div>

      <!-- 🟢 Только документы -->
      <div v-else-if="documentPosts.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div
          v-for="p in documentPosts"
          :key="p.id"
          class="border border-helix-green/50 bg-black/40 p-4 rounded-md hover:bg-helix-green/10 cursor-pointer transition-all duration-300 shadow-glow group"
          @click="$router.push(`/post/${p.id}`)"
        >
          <!-- Иконка -->
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-12 h-12 flex items-center justify-center border border-helix-green/40 rounded-md bg-black/40 text-2xl font-bold text-helix-light group-hover:shadow-glow transition"
            >
              📄
            </div>
            <div class="flex-1 text-left">
              <h3 class="text-sm font-bold text-helix-light group-hover:text-helix-green transition">
                {{ p.title }}
              </h3>
              <p class="text-xs opacity-70 mt-1">
                {{ p.fileType ? p.fileType.toUpperCase() : 'НЕИЗВЕСТНЫЙ ТИП' }}
              </p>
            </div>
          </div>

          <!-- Статус и подпись -->
          <p v-if="p.coverCaption" class="text-xs italic opacity-70 mb-1 text-center">
            "{{ p.coverCaption }}"
          </p>

          <div class="text-xs opacity-50 border-t border-helix-green/30 pt-2 text-center">
            {{ new Date(p.createdAt).toLocaleDateString() }}
          </div>
        </div>
      </div>

      <p v-else class="opacity-60 text-center mt-10">ДОКУМЕНТЫ НЕ НАЙДЕНЫ.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import api from '../services/api'

const posts = ref([])
const loading = ref(true)

/* === LOAD DATA === */
onMounted(async () => {
  try {
    const res = await api.get('/posts/archive', { withCredentials: true })
    posts.value = res.data || []
  } catch (err) {
    console.error('Ошибка загрузки документов:', err)
  } finally {
    loading.value = false
  }
})

/* === ФИЛЬТР ТОЛЬКО ДЛЯ ДОКУМЕНТОВ === */
const documentPosts = computed(() =>
  posts.value.filter(p => {
    const type = (p.fileType || '').toLowerCase()
    return (
      type.startsWith('application/') ||
      ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx'].some(ext => type.includes(ext))
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
    'ДОСТУП К ФАЙЛАМ ИССЛЕДОВАНИЙ...',
    'РАСШИФРОВКА ЗАШИФРОВАННОГО ДОКУМЕНТА...',
    'ПОДТВЕРЖДЕНИЕ ПОДПИСИ...',
    'УЗЕЛ: БЕЗОПАСНАЯ СЕТЬ'
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
.shadow-glow {
  box-shadow: 0 0 10px rgba(0, 255, 150, 0.5);
}
</style>
