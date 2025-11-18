<template>
  <div class="crt-overlay"></div>
</template>

<script setup></script>

<style scoped>
.crt-overlay{
  position:fixed; inset:0; pointer-events:none; z-index:0;
  background:
    repeating-linear-gradient(to bottom, rgba(0,255,128,.035) 0 1px, transparent 2px 3px),
    radial-gradient(ellipse at center, rgba(0,255,128,.04), rgba(0,0,0,.15) 60%);
  animation:flicker .12s infinite;
  mix-blend-mode:overlay;
}
@keyframes flicker{
  0%,19%,21%,23%,25%,54%,56%,100%{opacity:.98}
  20%,24%,55%{opacity:.92}
}
</style>
