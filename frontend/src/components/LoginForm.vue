<template>
  <form @submit.prevent="onSubmit" class="flex flex-col gap-3 w-72">
    <label>Электронная почта</label>
    <input v-model.trim="email" type="email" class="bg-black border border-green-400 px-2 py-1 text-green-400" />
    <label>Пароль</label>
    <input v-model="password" type="password" class="bg-black border border-green-400 px-2 py-1 text-green-400" />
    <button type="submit" class="mt-2 border border-green-400 px-4 py-1 hover:bg-green-400 hover:text-black transition-colors">
      ДОСТУП
    </button>
    <p v-if="error" class="text-red-400 text-sm mt-1">{{ error }}</p>
  </form>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'

const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const auth = inject('auth')

async function onSubmit(){
  error.value = ''
  try{
    const res = await apiRequest('/auth/login', 'POST', { email: email.value, password: password.value })
    auth.login(res.user, res.token || 'session') // токен опционален в нашем бэке
    // Разветвление по ролям
    if(res.user.role === 'ADMIN') router.push('/admin')
    else router.push('/home')
  }catch(e){
    error.value = e.message || 'Login failed'
  }
}
</script>
