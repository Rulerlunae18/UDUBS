<template>
  <div class="border border-green-400 p-3">
    <div class="text-sm opacity-80">{{ title }}</div>
    <div class="font-bold">{{ name }}</div>
    <div class="text-xs opacity-60">{{ bio }}</div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  name: String,
  bio: String,
})
</script>
