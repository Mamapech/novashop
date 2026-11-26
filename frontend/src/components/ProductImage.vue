<script setup>
import { computed } from "vue"
import { imageUrl } from "@/api/client"

// Shows the product picture, or a neutral placeholder when there is none yet
const props = defineProps({
  src: { type: String, default: null },
  alt: { type: String, default: "" },
  ratio: { type: String, default: "4 / 3" },
})

const url = computed(() => imageUrl(props.src))
</script>

<template>
  <img v-if="url" :src="url" :alt="alt" class="product-img" :style="{ aspectRatio: ratio }" loading="lazy" />
  <div v-else class="product-img placeholder" :style="{ aspectRatio: ratio }" role="img" :aria-label="alt">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 8l9-5 9 5v8l-9 5-9-5z M3 8l9 5 9-5 M12 13v8" />
    </svg>
  </div>
</template>

<style scoped>
.product-img {
  width: 100%;
  object-fit: cover;
  background: var(--bg-alt);
}
.placeholder {
  display: grid;
  place-items: center;
  color: #c7c7cc;
}
.placeholder svg {
  width: 30%;
  height: 30%;
}
</style>
