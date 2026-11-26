import { defineStore } from "pinia"
import { ref } from "vue"

// Small pop-up messages in the corner ("Added to cart", errors, ...)
export const useToastStore = defineStore("toast", () => {
  const toasts = ref([])
  let nextId = 1

  function show(message, type = "success", timeout = 3000) {
    const id = nextId++
    toasts.value.push({ id, message, type })
    setTimeout(() => dismiss(id), timeout)
  }

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    dismiss,
    success: (msg) => show(msg, "success"),
    error: (msg) => show(msg, "error", 5000),
  }
})
