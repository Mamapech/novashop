import { defineStore } from "pinia"
import { ref, computed, watch } from "vue"

const CART_KEY = "novashop_cart"

// The cart lives in the browser (localStorage) until the customer checks out
export const useCartStore = defineStore("cart", () => {
  const items = ref(JSON.parse(localStorage.getItem(CART_KEY) || "[]"))

  watch(items, (value) => localStorage.setItem(CART_KEY, JSON.stringify(value)), { deep: true })

  const count = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
  // Shipping is free, so the total matches what the server charges
  const total = computed(() => items.value.reduce((sum, i) => sum + i.price * i.quantity, 0))

  function add(product, quantity = 1) {
    const existing = items.value.find((i) => i.productId === product.id)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, product.stock)
    } else {
      items.value.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
        quantity: Math.min(quantity, product.stock),
      })
    }
  }

  function setQuantity(productId, quantity) {
    const item = items.value.find((i) => i.productId === productId)
    if (!item) return
    item.quantity = Math.max(1, Math.min(quantity, item.stock))
  }

  function remove(productId) {
    items.value = items.value.filter((i) => i.productId !== productId)
  }

  function clear() {
    items.value = []
  }

  return { items, count, total, add, setQuantity, remove, clear }
})
