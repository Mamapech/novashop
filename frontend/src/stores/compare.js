import { defineStore } from "pinia"
import { ref, watch } from "vue"

const KEY = "novashop_compare"
export const MAX_COMPARE = 3

// Up to 3 product ids the customer wants to compare side by side
export const useCompareStore = defineStore("compare", () => {
  const ids = ref(JSON.parse(localStorage.getItem(KEY) || "[]"))
  watch(ids, (value) => localStorage.setItem(KEY, JSON.stringify(value)), { deep: true })

  const has = (id) => ids.value.includes(id)

  // Returns false when the list is already full
  function toggle(id) {
    if (has(id)) {
      ids.value = ids.value.filter((x) => x !== id)
      return true
    }
    if (ids.value.length >= MAX_COMPARE) return false
    ids.value.push(id)
    return true
  }

  function remove(id) {
    ids.value = ids.value.filter((x) => x !== id)
  }

  function clear() {
    ids.value = []
  }

  return { ids, has, toggle, remove, clear }
})
