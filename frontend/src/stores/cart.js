import { defineStore } from "pinia"
import { ref, computed, watch } from "vue"

const CART_KEY = "novashop_cart_v2"

// The cart lives in the browser (localStorage) until the customer checks out.
// Each line is one product variant (e.g. Aurora Book 14, Midnight, 512GB).
export const useCartStore = defineStore("cart", () => {
  const items = ref(JSON.parse(localStorage.getItem(CART_KEY) || "[]"))

  watch(items, (value) => localStorage.setItem(CART_KEY, JSON.stringify(value)), { deep: true })

  const count = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
  // Shipping is free, so the total matches what the server charges
  const total = computed(() => items.value.reduce((sum, i) => sum + i.price * i.quantity, 0))

  function variantLabel(variant) {
    return [variant.colorName, variant.sizeLabel].filter(Boolean).join(", ")
  }

  function add(product, variant, quantity = 1) {
    const existing = items.value.find((i) => i.variantId === variant.id)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, variant.stock, 20)
      return
    }
    items.value.push({
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      variantLabel: variantLabel(variant),
      price: variant.price,
      imageUrl: variant.imageUrl || product.imageUrl,
      categorySlug: product.category?.slug,
      stock: variant.stock,
      quantity: Math.min(quantity, variant.stock, 20),
    })
  }

  function setQuantity(variantId, quantity) {
    const item = items.value.find((i) => i.variantId === variantId)
    if (!item) return
    item.quantity = Math.max(1, Math.min(quantity, item.stock, 20))
  }

  function remove(variantId) {
    items.value = items.value.filter((i) => i.variantId !== variantId)
  }

  function clear() {
    items.value = []
  }

  return { items, count, total, add, setQuantity, remove, clear, variantLabel }
})
