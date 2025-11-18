<template>
  <form @submit.prevent="send" class="flex flex-col gap-3 w-72">
    <label>Электронная почта</label>
    <input v-model.trim="email" type="email" class="bg-black border border-green-400 px-2 py-1 text-green-400" />
    <label>Документ</label>
    <input ref="fileInput" type="file" class="bg-black border border-green-400 px-2 py-1 text-green-400" />
    <button type="submit" class="mt-2 border border-green-400 px-4 py-1 hover:bg-green-400 hover:text-black transition-colors">
      Отправить заявку
    </button>
    <p v-if="message" class="text-green-400 text-sm mt-1">{{ message }}</p>
    <p v-if="error" class="text-red-400 text-sm mt-1">{{ error }}</p>
  </form>
</template>

<script setup>
import { ref } from 'vue'
const email = ref('')
const fileInput = ref(null)
const message = ref('')
const error = ref('')

async function send(){
  try{
    const fd = new FormData()
    fd.append('email', email.value)
    if(fileInput.value?.files?.[0]) fd.append('file', fileInput.value.files[0])

    const res = await fetch(backendUrl('/api/auth/register'), { method:'POST', body: fd })
    const data = await res.json()
    if(!res.ok) throw new Error(data.error || 'Ошибка')
    message.value = data.message
    error.value = ''
  }catch(e){
    error.value = e.message
    message.value = ''
  }
}
</script>
