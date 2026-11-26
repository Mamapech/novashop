<script setup>
import ProductImage from "./ProductImage.vue"
import { useCartStore } from "@/stores/cart"
import { useToastStore } from "@/stores/toast"
import { money } from "@/utils/format"

const props = defineProps({ product: { type: Object, required: true } })
const cart = useCartStore()
const toast = useToastStore()

function addToCart() {
  cart.add(props.product)
  toast.success(`Added ${props.product.name} to cart`)
}
</script>

<template>
  <article class="product card">
    <RouterLink :to="`/products/${product.id}`" class="image-link">
      <ProductImage :product="product" />
      <span v-if="product.stock === 0" class="badge badge-muted tag">Sold out</span>
      <span v-else-if="product.isFeatured" class="badge tag">Featured</span>
    </RouterLink>
    <div class="body">
      <span class="brand">{{ product.brand?.name }}</span>
      <RouterLink :to="`/products/${product.id}`" class="name">{{ product.name }}</RouterLink>
      <div class="bottom">
        <span class="price">{{ money(product.price) }}</span>
        <button
          class="btn btn-outline btn-sm"
          :disabled="product.stock === 0"
          @click="addToCart"
          :aria-label="`Add ${product.name} to cart`"
        >
          Add
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, transform 0.2s;
}
.product:hover {
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}
.image-link {
  position: relative;
  display: block;
}
.tag {
  position: absolute;
  top: 12px;
  left: 12px;
  background: #fff;
}
.body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.brand {
  font-size: 0.8rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.name {
  color: var(--ink);
  font-weight: 600;
  line-height: 1.35;
}
.bottom {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price {
  font-weight: 700;
  font-size: 1.1rem;
}
</style>
