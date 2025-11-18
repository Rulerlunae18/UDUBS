<template>
  <div class="relative min-h-screen bg-helix-dark text-helix-green font-mono overflow-hidden">
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
    <div class="relative z-10 max-w-6xl mx-auto p-8 space-y-12">
      <h1 class="text-2xl text-center mb-8 tracking-widest text-helix-light">
        [ АДМИН / УПРАВЛЕНИЕ ПОСТАМИ ]
      </h1>

      <!-- === CREATE POST FORM === -->
      <form
        @submit.prevent="createPost"
        class="border border-helix-green/40 p-6 bg-black/40 backdrop-blur-sm shadow-glow space-y-5 rounded-xl"
      >
        <h2 class="text-lg font-bold text-helix-green mb-2">СОЗДАТЬ НОВУЮ ЗАПИСЬ</h2>

        <!-- 🔸 Title / Clearance -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm opacity-70">Заголовок</label>
            <input v-model="title" placeholder="Название записи" class="input-term" />
          </div>
          <div>
            <label class="block text-sm opacity-70">Уровень допуска</label>
            <select v-model="clearance" class="input-term">
              <option value="">— нет —</option>
              <option value="D-13">D-13</option>
              <option value="D-4">D-4</option>
              <option value="CONFIDENTIAL">КОНФИДЕНЦИАЛЬНО</option>
            </select>
          </div>
        </div>

        <!-- 🔸 Body -->
        <div>
          <label class="block text-sm opacity-70">Текст записи</label>
          <textarea v-model="body" rows="6" class="input-term"></textarea>
        </div>

        <!-- 🔸 Cover file -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm opacity-70 mb-1">Обложка / документ</label>
            <div
              class="input-term flex items-center justify-between cursor-pointer"
              @click="$refs.fileInput.click()"
            >
              <span class="truncate opacity-80 text-sm">
                {{ selectedFileName || 'Файл не выбран' }}
              </span>
              <span class="ml-3 px-3 py-[4px] border border-helix-green/50 rounded-md bg-helix-green/10 hover:bg-helix-green/20 font-bold">
                Загрузить
              </span>
            </div>

            <input
              ref="fileInput"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt"
              class="hidden"
              @change="onFileChange"
            />
          </div>

          <div>
            <label class="block text-sm opacity-70">Подпись к обложке</label>
            <input v-model="coverCaption" class="input-term" />
          </div>
        </div>

        <!-- 🔸 Статус -->
        <div>
          <label class="block text-sm opacity-70">Штамп / статус</label>
          <input v-model="stamp" class="input-term" />
        </div>

        <!-- 🔸 Автор -->
        <div>
          <label class="block text-sm opacity-70">Автор (Исследователь)</label>
          <select v-model="selectedAuthorId" class="input-term">
            <option disabled value="">Выберите автора</option>

            <!-- Admin -->
            <option
              v-for="u in fakeUsers"
              :key="u.id"
              :value="u.id"
            >
              {{ u.codename }} — {{ u.rank }}
            </option>
          </select>
        </div>

        <!-- Submit -->
        <div class="flex items-center gap-4 pt-4">
          <button type="submit" class="btn-term w-full">[ СОХРАНИТЬ ]</button>
          <span v-if="error" class="text-red-400 text-sm">{{ error }}</span>
        </div>
      </form>

      <!-- === POSTS LIST === -->
      <section class="border border-helix-green/40 p-6 bg-black/40 backdrop-blur-sm shadow-glow space-y-3 rounded-xl">
        <h2 class="text-lg font-bold text-helix-green mb-3">БАЗА ДАННЫХ ЗАПИСЕЙ</h2>

        <div v-if="posts.length" class="space-y-3">
          <div
            v-for="p in posts"
            :key="p.id"
            class="border border-helix-green/30 rounded-xl p-4 hover:bg-helix-green/5 transition relative"
          >
            <div class="flex justify-between items-start mb-1">
              <div>
                <h3 class="font-bold text-helix-light">{{ p.title }}</h3>
                <p class="text-xs opacity-70">
                  Автор: {{ p.fakeAuthor?.codename || 'Неизвестно' }}
                </p>
                <p class="text-xs opacity-70">
                  Штамп: {{ p.stamp || '—' }} | Допуск: {{ p.clearance || '—' }}
                </p>
              </div>
              <button @click="remove(p.id)" class="text-red-400 hover:text-red-200 text-xs">
                [ УДАЛИТЬ ]
              </button>
            </div>

            <div class="relative mt-2">
              <!-- Текст поста с поддержкой HTML -->
              <div
                class="opacity-80 text-sm whitespace-pre-wrap leading-relaxed transition-all duration-500 ease-in-out"
                :class="{
                  'max-h-32 overflow-hidden': !expanded[p.id] && p.body && p.body.length > 300
                }"
              >
                <!-- HTML-теги в теле поста: <b>, <i>, <br> и т.д. -->
                <div v-html="p.body"></div>
              </div>

              <!-- Градиентная “тень” снизу, только если текст обрезан -->
              <div
                v-if="p.body && p.body.length > 300 && !expanded[p.id]"
                class="pointer-events-none absolute bottom-0 left-0 right-0 h-12
                      bg-gradient-to-t from-black/20 via-black/10 to-transparent
                      transition-opacity duration-500"
              ></div>

              <!-- Кнопка “развернуть / свернуть”, только если текста > 300 символов -->
              <button
                v-if="p.body && p.body.length > 300"
                @click="toggleExpand(p.id)"
                class="mt-3 inline-flex items-center gap-1 text-[11px] tracking-widest uppercase
                      px-3 py-1 rounded-none border border-helix-green/60
                      shadow-[0_0_10px_rgba(0,255,150,0.25)]
                      transition-all duration-300"
              >
                <span v-if="!expanded[p.id]">[ РАЗВЕРНУТЬ ЗАПИСЬ ]</span>
                <span v-else>[ СЖАТЬ ЗАПИСЬ ]</span>
              </button>
            </div>

          </div>
        </div>

        <p v-else class="opacity-60">ЗАПИСЕЙ НЕТ.</p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import api from '../services/api'

/* ============================
   РАСШИРЕНИЕ / СЖАТИЕ ТЕКСТА
   ============================ */
const expanded = reactive({})

function toggleExpand(id) {
  expanded[id] = !expanded[id]
}

/* В старом коде */
const isExpanded = reactive({})

function shortened(text) {
  if (!text) return ""
  if (text.length <= 300) return text
  return text.slice(0, 300) + "…"
}

function toggle(id) {
  isExpanded[id] = !isExpanded[id]
}

/* ========== FORM FIELDS ========== */
const title = ref('')
const body = ref('')
const stamp = ref('')
const clearance = ref('')
const coverCaption = ref('')
const selectedFileName = ref('')
const selectedAuthorId = ref('')

/* ========== DATA ========== */
const posts = ref([])
const fakeUsers = ref([])
const error = ref('')

/* file input */
const fileInput = ref(null)

function onFileChange(e) {
  const file = e.target.files[0]
  selectedFileName.value = file ? file.name : ''
}

/* =============================
   CREATE POST
   ============================= */
async function createPost() {
  error.value = ''

  try {
    const fd = new FormData()
    fd.append('title', title.value)
    fd.append('body', body.value)
    fd.append('stamp', stamp.value || '')
    fd.append('clearance', clearance.value || '')
    fd.append('coverCaption', coverCaption.value || '')
    fd.append('fakeAuthorId', selectedAuthorId.value)

    const coverFile = fileInput.value?.files?.[0]
    if (coverFile) {
      fd.append('cover', coverFile)
      fd.append('fileType', coverFile.name.split('.').pop().toLowerCase())
    }

    await api.post('/posts', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    })

    // reset
    title.value =
      body.value =
      stamp.value =
      clearance.value =
      coverCaption.value =
      selectedAuthorId.value =
        ''
    selectedFileName.value = ''
    if (fileInput.value) fileInput.value.value = ''

    await loadPosts()
  } catch (err) {
    console.error(err)
    error.value = 'Ошибка создания поста'
  }
}

/* =============================
   LOAD POSTS
   ============================= */
async function loadPosts() {
  const res = await api.get('/posts', { withCredentials: true })
  posts.value = res.data || []

  // создаём ключи в expanded, чтобы не было undefined
  posts.value.forEach(p => {
    if (expanded[p.id] === undefined) expanded[p.id] = false
  })
}

/* =============================
   LOAD AUTHORS
   ============================= */
async function loadFakeUsers() {
  const res = await api.get('/fakeusers')
  fakeUsers.value = res.data || []
}

/* =============================
   DELETE POST
   ============================= */
async function remove(id) {
  if (!confirm('Удалить пост?')) return
  await api.delete(`/posts/${id}`)
  await loadPosts()
}

/* =============================
   PIXEL / GLITCH BACKGROUND
   ============================= */
const pixelCanvas = ref(null)
let ctx, pixels = [], animFrame, glitchTimer

const initPixels = () => {
  const w = (pixelCanvas.value.width = window.innerWidth)
  const h = (pixelCanvas.value.height = window.innerHeight)
  pixels = Array.from({ length: 100 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speedY: 0.2 + Math.random() * 1,
    size: Math.random() * 2 + 1,
    alpha: 0.2 + Math.random() * 0.5,
  }))
}

const draw = () => {
  const w = pixelCanvas.value.width
  const h = pixelCanvas.value.height
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fillRect(0, 0, w, h)
  pixels.forEach(p => {
    ctx.fillStyle = `rgba(0,255,100,${p.alpha})`
    ctx.fillRect(p.x, p.y, p.size, p.size)
    p.y += p.speedY
    if (p.y > h) p.y = 0
  })
  animFrame = requestAnimationFrame(draw)
}

const glitchLines = ref([])

const generateGlitch = () => {
  const lines = [
    'ОБРАБОТКА ЗАПИСЕЙ...',
    'СИГНАЛ СТАБИЛЕН',
    'КАНАЛ ГОТОВ',
    'ПРОГРУЗКА ЛОГОВ...'
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
  loadPosts()
  loadFakeUsers()
  ctx = pixelCanvas.value.getContext('2d')
  initPixels()
  draw()
  glitchTimer = setInterval(generateGlitch, 2000)
  window.addEventListener('resize', initPixels)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', initPixels)
})
</script>



<style scoped>
/* === INPUTS === */
.input-term {
  background: black;
  border: 1px solid rgba(0, 255, 150, 0.4);
  color: #00ff9d;
  width: 100%;
  padding: 6px 8px;
  font-size: 14px;
  border-radius: 6px;
  outline: none;
  transition: all 0.15s;
}
.input-term:focus {
  border-color: #00ff9d;
  box-shadow: 0 0 6px #00ff9d;
}

/* === BUTTONS === */
.btn-term {
  border: 1px solid #00ff9d;
  color: #00ff9d;
  padding: 6px 12px;
  font-weight: bold;
  border-radius: 6px;
  transition: 0.2s;
}
.btn-term:hover {
  background: #00ff9d;
  color: black;
}

/* === EFFECTS === */
.pixel-canvas,
.crt,
.scanline {
  pointer-events: none;
  position: fixed;
  inset: 0;
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
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(0,255,100,0.15),
    transparent
  );
  animation: scan 6s linear infinite;
}
@keyframes scan {
  0% { top: -20%; }
  100% { top: 120%; }
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
  0% { opacity: 0; transform: scale(0.95); }
  20% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.1); }
}

.shadow-glow {
  box-shadow: 0 0 10px rgba(0, 255, 150, 0.4);
}
</style>
