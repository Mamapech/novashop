<script setup>
defineProps({
  title: { type: String, required: true },
  text: { type: String, default: "" },
})
</script>

<template>
  <div class="empty card">
    <div class="icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M3 7h18l-2 13H5z" /><path d="M8 7a4 4 0 0 1 8 0" />
      </svg>
    </div>
    <h3>{{ title }}</h3>
    <p v-if="text" class="muted">{{ text }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
  padding: 56px 24px;
}
.icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--brand-soft);
  color: var(--brand);
}
p {
  margin: 0 0 20px;
}
</style>
