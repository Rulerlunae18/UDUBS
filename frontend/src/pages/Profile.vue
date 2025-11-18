<!-- src/pages/Profile.vue -->
<template>
  <div class="relative min-h-screen bg-helix-dark text-helix-green font-mono overflow-hidden">
    <!-- === CRT эффект === -->
    <div class="crt"></div>
    <canvas ref="pixelCanvas" class="pixel-canvas"></canvas>
    <div class="scanline"></div>

    <!-- === Контент === -->
    <div class="relative z-10 max-w-3xl mx-auto py-12 px-6 space-y-10 fade-in">
      <h1 class="text-2xl text-center tracking-wider text-helix-light drop-shadow-[0_0_10px_rgba(0,255,150,0.6)]">
        [ ПРОФИЛЬ ОПЕРАТОРА ]
      </h1>

      <!-- === Профиль === -->
      <section class="border border-helix-green/50 p-6 bg-black/40 shadow-glow space-y-4">
        <div class="flex flex-col sm:flex-row gap-6 items-center">
          <!-- Аватар -->
          <div class="relative">
            <img
              v-if="preview || profile.avatarUrl"
              :src="preview || backendUrl(profile.avatarUrl)"
              class="w-36 h-36 object-cover rounded-full border border-helix-green/50 shadow-glow"
            />
            <div
              v-else
              class="w-36 h-36 flex items-center justify-center rounded-full border border-helix-green/30 text-xs opacity-60"
            >
              Нет аватара
            </div>

            <!-- Кнопка загрузки есть у всех ролей: ADMIN и USER -->
            <label
              class="absolute bottom-1 right-1 cursor-pointer bg-helix-green/80 text-black px-2 py-1 text-xs font-bold hover:bg-helix-green transition"
            >
              UPLOAD
              <input type="file" class="hidden" accept="image/*" @change="onFileChange" />
            </label>
          </div>

          <!-- Информация -->
          <div class="flex-1 w-full space-y-3">
            <div>
              <label class="label-term">Имя / Callsign</label>
              <input
                v-model="name"
                class="input-term"
                :disabled="!isAdmin"
                placeholder="Operator Name"
              />
            </div>

            <div>
              <label class="label-term">Должность / Title</label>
              <input
                v-model="title"
                class="input-term"
                :disabled="!isAdmin"
                placeholder="Research Specialist"
              />
            </div>

            <div>
              <label class="label-term">Био / Notes</label>
              <textarea
                v-model="bio"
                rows="3"
                class="input-term"
                :disabled="!isAdmin"
                placeholder="Field agent notes..."
              ></textarea>
            </div>

            <!-- Кнопка сохранения видна только админу -->
            <button @click="saveProfile" class="btn-term mt-4">[ СОХРАНИТЬ ИЗМЕНЕНИЯ ]</button>

            <p v-if="message" class="text-xs opacity-70 mt-2">{{ message }}</p>

            <!-- Подсказка для USER о загрузке аватара -->
            <p v-if="!isAdmin" class="text-xs opacity-70 mt-2">
              Поля только для чтения. Вы можете загрузить аватар, используя кнопку на фото.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, inject, computed } from 'vue'
import api from '../services/api'
import { backendUrl } from '../services/env'

const auth = inject('auth')
const isAdmin = computed(() => auth.user?.role === 'ADMIN')

const profile = ref({})
const name = ref('')
const title = ref('')
const bio = ref('')
const avatarFile = ref(null)
const preview = ref(null)
const message = ref('')

onMounted(async () => {
  if (isAdmin.value) {
    // Админ редактирует свой системный профиль (User)
    const res = await api.get(`/profiles/${auth.user.id}`)
    profile.value = res.data
    name.value = profile.value.name || ''
    title.value = profile.value.title || ''
    bio.value = profile.value.bio || ''
  } else {
    // Обычный пользователь: тянем профиль realUser
    const res = await api.get(`/realusers/me`, { withCredentials: true })
    profile.value = res.data
    // Поля видим только как readonly
    name.value = profile.value.username || ''
    title.value = 'Researcher'
    bio.value = '' // если когда-то появится поле bio у realUser — подставишь
  }
})

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) {
    avatarFile.value = file
    preview.value = URL.createObjectURL(file)
  }
}

// Сохранить изменения
async function saveProfile() {
  try {
    if (isAdmin.value) {
      // Админ: обновляет User поля + (возможно) аватар
      const fd = new FormData()
      fd.append('name', name.value)
      fd.append('title', title.value)
      fd.append('bio', bio.value)
      if (avatarFile.value) fd.append('avatar', avatarFile.value)

      const res = await api.put(`/profiles/${auth.user.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      })

      auth.user.name = res.data.name ?? name.value
      auth.user.title = res.data.title ?? title.value
      auth.user.bio = res.data.bio ?? bio.value
      if (res.data.avatarUrl) auth.user.avatarUrl = backendUrl(res.data.avatarUrl)
      message.value = 'Profile successfully updated.'
    } else {
      // RealUser: может менять ТОЛЬКО аватар
      if (!avatarFile.value) {
        message.value = 'Select an image first.'
        return
      }
      const fd = new FormData()
      fd.append('avatar', avatarFile.value)
      const res = await api.put(`/realusers/me/avatar`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      })
      const newUrl = res.data?.avatarUrl
      if (newUrl) {
        profile.value.avatarUrl = newUrl
        auth.user.avatarUrl = backendUrl(newUrl)
        message.value = 'Avatar updated.'
      } else {
        message.value = 'Avatar updated, but URL not returned.'
      }
    }
  } catch (err) {
    console.error(err)
    message.value = 'Error updating profile.'
  }
}

/* === CRT фон — как у тебя === */
const pixelCanvas = ref(null)
let ctx, pixels = [], animFrame
const initPixels = () => {
  const w = pixelCanvas.value.width = window.innerWidth
  const h = pixelCanvas.value.height = window.innerHeight
  pixels = Array.from({ length: 120 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    speedY: 0.2 + Math.random() * 1,
    size: Math.random() * 2 + 1,
    alpha: 0.25 + Math.random() * 0.5,
  }))
}
const draw = () => {
  const w = pixelCanvas.value.width
  const h = pixelCanvas.value.height
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(0, 0, w, h)
  pixels.forEach(p => {
    ctx.fillStyle = `rgba(0,255,100,${p.alpha})`
    ctx.fillRect(p.x, p.y, p.size, p.size)
    p.y += p.speedY
    if (p.y > h) p.y = 0
  })
  animFrame = requestAnimationFrame(draw)
}
onMounted(() => {
  ctx = pixelCanvas.value.getContext('2d')
  initPixels()
  draw()
  window.addEventListener('resize', initPixels)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(animFrame)
  window.removeEventListener('resize', initPixels)
})
</script>


<style scoped>
.input-term {
  background: black;
  border: 1px solid rgba(0,255,150,0.4);
  color: #00ff9d;
  width: 100%;
  padding: 4px 6px;
  font-size: 14px;
  outline: none;
  transition: all 0.15s;
}
.input-term:disabled {
  opacity: .6;
  cursor: not-allowed;
}
.input-term:focus {
  border-color: #00ff9d;
  box-shadow: 0 0 5px #00ff9d;
}

.label-term {
  font-size: 12px;
  opacity: 0.7;
}

.btn-term {
  border: 1px solid #00ff9d;
  color: #00ff9d;
  padding: 4px 10px;
  font-weight: bold;
  transition: 0.2s;
}
.btn-term:hover {
  background: #00ff9d;
  color: black;
}

.pixel-canvas, .crt, .scanline { pointer-events: none; position: fixed; inset: 0; z-index: 0; }
.pixel-canvas { opacity: 0.35; mix-blend-mode: lighten; }
.crt { background: repeating-linear-gradient(rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 2px); mix-blend-mode: screen; }
.scanline {
  height: 20%;
  background: linear-gradient(to bottom, transparent, rgba(0,255,100,0.15), transparent);
  animation: scan 6s linear infinite;
}
@keyframes scan { 0% { top: -20%; } 100% { top: 120%; } }
.fade-in { animation: fade-in 0.6s ease-out; }
@keyframes fade-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.shadow-glow { box-shadow: 0 0 10px rgba(0, 255, 150, 0.5); }
</style>
