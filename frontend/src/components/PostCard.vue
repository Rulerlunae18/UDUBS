<template>
  <div @click="$emit('open', post.id)" class="border border-green-400 p-3 cursor-pointer hover:bg-green-900 transition-colors">
    <h3 class="text-lg mb-1">{{ post.title }}</h3>
    <p class="text-sm opacity-80 truncate">{{ post.body }}</p>
    <p v-if="post.image" class="text-xs opacity-60 mt-1">📷 картинка</p>
  </div>
</template>

<script setup>
defineProps({ post: { type:Object, required:true } })
defineEmits(['open'])
</script>
