<script setup>
import { useToastStore } from "@/stores/toast"
const toast = useToastStore()
</script>

<template>
  <div class="toasts" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toast.toasts" :key="t.id" class="toast" :class="t.type" @click="toast.dismiss(t.id)">
        <span class="dot"></span>{{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 260px;
  max-width: 380px;
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  background: var(--ink);
  color: #fff;
  box-shadow: var(--shadow);
  cursor: pointer;
  font-size: 0.925rem;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #34d399;
}
.toast.error .dot {
  background: #f87171;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
