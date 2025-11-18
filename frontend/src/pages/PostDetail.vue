<template>
  <div class="relative min-h-screen bg-helix-dark text-helix-green font-mono overflow-hidden">
    <!-- === ФОННЫЕ ЭФФЕКТЫ === -->
    <div class="crt"></div>
    <canvas ref="pixelCanvas" class="pixel-canvas"></canvas>
    <div class="scanline"></div>

    <!-- === ГЛИТЧ-ЛИНИИ === -->
    <div
      v-for="line in glitchLines"
      :key="line.id"
      class="glitch-line"
      :style="{ top: line.y + 'px', left: line.x + 'px' }"
    >
      {{ line.text }}
    </div>

    <!-- === ОСНОВНОЙ КОНТЕНТ === -->
    <div class="relative z-10 max-w-3xl mx-auto py-10 px-6">
      <div v-if="loading" class="text-center opacity-60">ЗАГРУЗКА...</div>

      <div v-else-if="post" class="fade-in">
        <!-- === МЕТАДАННЫЕ === -->
        <div class="meta text-xs opacity-70 mb-3 border-l border-helix-green/40 pl-3 tracking-wide">
          <span>ID ФАЙЛА: {{ post.id }}</span> •
          <span>УРОВЕНЬ ДОСТУПА: {{ post.clearance || '—' }}</span> •
          <span>ДАТА: {{ new Date(post.createdAt).toLocaleString() }}</span>
        </div>

        <!-- === ЗАГОЛОВОК === -->
        <h1 class="text-3xl font-bold mb-3 tracking-wide text-helix-light drop-shadow-[0_0_10px_rgba(0,255,150,0.4)] uppercase">
          {{ post.title }}
        </h1>

        <!-- === КАРТОЧКА АВТОРА === -->
        <div
          v-if="post.author"
          class="author-card flex items-center gap-4 p-4 mb-6 border border-helix-green/40 rounded-md bg-black/30 shadow-glow"
        >
          <div
            class="w-14 h-14 rounded-full border border-helix-green/50 overflow-hidden flex-shrink-0 shadow-[0_0_8px_rgba(0,255,150,0.3)]"
          >
            <img
              v-if="post.author.avatarUrl"
              :src="backendUrl(post.author.avatarUrl)"
              alt="avatar"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-helix-green bg-black text-lg font-bold"
            >
              ?
            </div>
          </div>

          <div class="flex-1 text-left">
            <p class="text-sm font-bold tracking-wider text-helix-light uppercase">
              [ {{ post.author.codename || 'SYSTEM' }} ]
            </p>
            <p class="text-xs opacity-70 mt-1">
              {{ post.author.rank || 'Researcher' }}
              <span v-if="post.author.clearance">
                / {{ post.author.clearance }}
              </span>
            </p>
          </div>

          <div
            class="text-xs opacity-60 font-bold tracking-widest border-l border-helix-green/40 pl-3 text-right leading-tight"
          >
            УЗЕЛ: АКТИВЕН <br />
            СТАТУС: ПРОВЕРЕН
          </div>
        </div>

        <!-- === ОБЛОЖКА / ДОКУМЕНТ === -->
        <div v-if="post.coverImage" class="mb-6 text-center">
          <!-- 🖼️ изображение -->
          <img
            v-if="post.fileType && post.fileType.startsWith('image/')"
            :src="backendUrl(post.coverImage)"
            class="w-full border border-helix-green/40 shadow-glow rounded-sm"
          />

          <!-- 📄 документ -->
          <div
            v-else-if="post.fileType && (
              post.fileType.startsWith('application/') ||
              ['pdf','doc','docx','txt','rtf','odt','xls','xlsx'].some(ext => post.fileType.includes(ext))
            )"
            class="text-center py-6 border border-helix-green/30 rounded-md bg-black/20"
          >
            <p class="text-sm mb-3 opacity-80">Приложенный документ:</p>
            <a
              :href="backendUrl(post.coverImage)"
              target="_blank"
              class="inline-block border border-helix-green/40 px-4 py-2 rounded-sm text-sm hover:bg-helix-green/10 transition"
            >
              📄 Открыть файл
            </a>
          </div>

          <!-- 🎯 резервный вариант -->
          <div v-else class="text-xs opacity-60 italic mt-2">
            Неизвестный формат файла ({{ post.fileType || 'н/д' }})
          </div>

          <p v-if="post.coverCaption" class="text-xs opacity-70 mt-2 italic text-center">
            {{ post.coverCaption }}
          </p>
        </div>

        <!-- === ОСНОВНОЙ ТЕКСТ === -->
        <div
          class="content text-sm opacity-90 leading-relaxed mb-8 border-l border-helix-green/30 pl-4"
          v-html="sanitizedBody"
        ></div>

        <!-- === ГАЛЕРЕЯ ИЗОБРАЖЕНИЙ === -->
        <div v-if="post.images?.length" class="grid grid-cols-2 gap-3 mt-6">
          <img
            v-for="img in post.images"
            :key="img.id"
            :src="backendUrl(img.imageUrl)"
            class="w-full h-44 object-cover border border-helix-green/30 hover:scale-105 transition"
          />
        </div>

        <!-- === СЧЕТЧИК ПРОСМОТРОВ === -->
        <p class="text-xs opacity-60 mt-8 text-right italic">
          Просмотров: {{ post.viewsCount || 0 }}
        </p>

        <!-- === ШТАМП/ПЕЧАТЬ === -->
        <div
          v-if="post.stamp"
          class="border-t border-helix-green/30 pt-3 text-xs opacity-60 italic text-center mt-4"
        >
          {{ post.stamp }}
        </div>
      </div>

      <div v-else class="text-center opacity-60">Пост не найден.</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'
import DOMPurify from 'dompurify'
import { backendUrl } from '../services/env'

const route = useRoute()
const post = ref(null)
const loading = ref(true)

/* === БЕЗОПАСНАЯ ОЧИСТКА HTML === */
const sanitizedBody = computed(() => {
  if (!post.value) return ''
  return DOMPurify.sanitize(post.value.body || '', {
    ALLOWED_TAGS: ['b','i','strong','em','br','ul','ol','li','p','a','h1','h2','h3','span'],
    ALLOWED_ATTR: ['href','target']
  })
})

/* === ЗАГРУЗКА ПОСТА === */
onMounted(async () => {
  try {
    const res = await api.get(`/posts/${route.params.id}`, { withCredentials: true })
    post.value = res.data
  } finally {
    loading.value = false
  }
})

/* === ОТСЛЕЖИВАНИЕ ПРОСМОТРОВ === */
onMounted(async () => {
  const postId = route.params.id
  let sessionId = localStorage.getItem('sessionId')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('sessionId', sessionId)
  }

  try {
    await api.post(`/posts/${postId}/view`, { sessionId })
  } catch (e) {
    console.error('Ошибка добавления просмотра:', e)
  }
})

/* === ПИКСЕЛЬНЫЙ ФОНОВЫЙ ЭФФЕКТ === */
const pixelCanvas = ref(null)
let ctx, pixels = [], animFrame, glitchTimer

const initPixels = () => {
  const w = pixelCanvas.value.width = window.innerWidth
  const h = pixelCanvas.value.height = window.innerHeight
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

/* === ЭФФЕКТ ГЛИТЧА === */
const glitchLines = ref([])
const generateGlitch = () => {
  const words = [
    "LINK STABLE...",
    "ACCESSING NODE...",
    "SYNCING DATABASE...",
    "TRACE SIGNAL OK"
  ]
  glitchLines.value.push({
    id: Date.now(),
    text: words[Math.floor(Math.random() * words.length)],
    x: Math.random() * window.innerWidth * 0.8,
    y: Math.random() * window.innerHeight * 0.8,
  })
  setTimeout(() => glitchLines.value.shift(), 1600)
}

onMounted(() => {
  ctx = pixelCanvas.value.getContext('2d')
  initPixels()
  draw()
  glitchTimer = setInterval(generateGlitch, 1400)
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

.fade-in { animation: fade-in 0.6s ease-out; }
@keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.shadow-glow { box-shadow: 0 0 10px rgba(0, 255, 150, 0.5); }

.author-card {
  position: relative;
  background: linear-gradient(180deg, rgba(0, 255, 100, 0.04) 0%, rgba(0, 255, 100, 0.02) 100%);
  border-radius: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}
.author-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 15px rgba(0, 255, 150, 0.35);
}
</style>
