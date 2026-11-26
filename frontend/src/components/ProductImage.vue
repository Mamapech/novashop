<script setup>
import { computed } from "vue"
import { imageUrl } from "@/api/client"

// Shows the product photo, or a colored placeholder with an icon when there is no photo yet
const props = defineProps({
  product: { type: Object, required: true },
})

const PALETTES = [
  ["#eef2ff", "#4f46e5"],
  ["#ecfeff", "#0891b2"],
  ["#fdf2f8", "#db2777"],
  ["#f0fdf4", "#16a34a"],
  ["#fff7ed", "#ea580c"],
]

const ICONS = {
  laptops: "M4 6h16v10H4z M2 19h20",
  audio: "M3 14v-2a9 9 0 0 1 18 0v2 M3 14h4v6H3z M17 14h4v6h-4z",
  accessories: "M3 7h18v10H3z M7 11h.01 M11 11h.01 M15 11h.01 M7 14h10",
  "smart-home": "M3 11 12 4l9 7 M5 10v10h14V10",
  wearables: "M8 7h8v10H8z M9 7l1-4h4l1 4 M9 17l1 4h4l1-4",
}

const BOX = "M3 8l9-5 9 5v8l-9 5-9-5z M3 8l9 5 9-5 M12 13v8"

const src = computed(() => imageUrl(props.product.imageUrl))
const colors = computed(() => PALETTES[props.product.id % PALETTES.length])
const icon = computed(() => ICONS[props.product.category?.slug] || BOX)
</script>

<template>
  <img v-if="src" :src="src" :alt="product.name" class="product-img" loading="lazy" />
  <div v-else class="product-img placeholder" :style="{ background: colors[0], color: colors[1] }">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
      <path :d="icon" />
    </svg>
  </div>
</template>

<style scoped>
.product-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}
.placeholder {
  display: grid;
  place-items: center;
}
.placeholder svg {
  width: 38%;
  height: 38%;
}
</style>
