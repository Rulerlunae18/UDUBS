<template>
  <section class="h-[70vh] flex flex-col items-center justify-center text-center gap-6">
    <h1 class="text-3xl tracking-widest animate-pulse">ДЕПАРТАМЕНТ ГЕНЕТИЧЕСКОГО ИНЖЕНЕРИНГА</h1>
    <div class="flex flex-col sm:flex-row gap-3">
      <router-link to="/login" class="border border-green-400 px-6 py-2 hover:bg-green-400 hover:text-black transition-colors">
        Вход в систему
      </router-link>
      <router-link to="/register" class="border border-green-400 px-6 py-2 hover:bg-green-400 hover:text-black transition-colors">
        Регистрация сотрудника
      </router-link>
    </div>
    <p class="text-xs opacity-60 mt-6">ИНИЦИАЛИЗАЦИЯ СЕКТОРА... ОК · СИНХРОНИЗАЦИЯ ДНК МАТРИЦЫ... ОК · ДОСТУП К ИНТЕРФЕЙСУ... ОК</p>
  </section>
</template>

<script setup></script>
