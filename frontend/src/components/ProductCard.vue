<script setup>
import { ref, computed } from "vue"
import ProductImage from "./ProductImage.vue"
import { useCompareStore, MAX_COMPARE } from "@/stores/compare"
import { useToastStore } from "@/stores/toast"
import { money } from "@/utils/format"

const props = defineProps({ product: { type: Object, required: true } })
const compare = useCompareStore()
const toast = useToastStore()

// Hovering a color dot previews that color's picture
const previewColor = ref(null)
const image = computed(() => previewColor.value?.imageUrl || props.product.imageUrl)
const hasOptions = computed(() => props.product.colors.length > 1 || props.product.sizeOptionName)

function toggleCompare() {
  if (!compare.toggle(props.product.id)) toast.error(`You can compare up to ${MAX_COMPARE} products`)
}
</script>

<template>
  <article class="product card">
    <RouterLink :to="`/products/${product.id}`" class="image-link" :aria-label="product.name">
      <ProductImage :src="image" :alt="product.name" />
    </RouterLink>
    <div class="body">
      <div class="colors" @mouseleave="previewColor = null">
        <button
          v-for="c in product.colors"
          :key="c.name"
          class="swatch"
          :style="{ background: c.hex }"
          :title="c.name"
          :aria-label="c.name"
          @mouseenter="previewColor = c"
          @focus="previewColor = c"
        ></button>
      </div>
      <span v-if="product.stock === 0" class="eyebrow muted">Sold out</span>
      <span v-else-if="product.isFeatured" class="eyebrow">New</span>
      <RouterLink :to="`/products/${product.id}`" class="name">{{ product.name }}</RouterLink>
      <p class="tagline">{{ product.tagline }}</p>
      <div class="bottom">
        <span class="price">{{ hasOptions ? "From " : "" }}{{ money(product.price) }}</span>
        <label class="compare small">
          <input type="checkbox" :checked="compare.has(product.id)" @change="toggleCompare" />
          Compare
        </label>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.3s, transform 0.3s;
}
.product:hover {
  box-shadow: 2px 8px 24px rgb(0 0 0 / 0.12);
  transform: scale(1.01);
}
.image-link {
  display: block;
}
.body {
  padding: 18px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.colors {
  display: flex;
  gap: 7px;
  margin-bottom: 10px;
  min-height: 12px;
}
.colors .swatch {
  border: 0;
  padding: 0;
  cursor: pointer;
}
.name {
  color: var(--ink);
  font-weight: 600;
  font-size: 19px;
  line-height: 1.25;
  letter-spacing: -0.01em;
}
.tagline {
  color: var(--muted);
  font-size: 14px;
  margin: 4px 0 0;
}
.bottom {
  margin-top: auto;
  padding-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price {
  font-size: 15px;
}
.compare {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--muted);
  cursor: pointer;
}
.compare input {
  accent-color: var(--brand);
}
</style>
