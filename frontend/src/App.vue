<script setup>
import AppHeader from "@/components/AppHeader.vue"
import AppFooter from "@/components/AppFooter.vue"
import ToastHost from "@/components/ToastHost.vue"
</script>

<template>
  <AppHeader />
  <main class="page">
    <RouterView />
  </main>
  <AppFooter />
  <ToastHost />
</template>
