<script setup>
import { ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import api, { errorMessage } from "@/api/client"
import { useCartStore } from "@/stores/cart"
import { useToastStore } from "@/stores/toast"
import { money } from "@/utils/format"
import ProductImage from "@/components/ProductImage.vue"
import ProductCard from "@/components/ProductCard.vue"

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const toast = useToastStore()

const product = ref(null)
const related = ref([])
const quantity = ref(1)
const error = ref("")

async function load() {
  product.value = null
  error.value = ""
  quantity.value = 1
  try {
    const { data } = await api.get(`/products/${route.params.id}`)
    product.value = data
    if (data.category) {
      const res = await api.get("/products", { params: { category: data.category.slug, limit: 5 } })
      related.value = res.data.data.filter((p) => p.id !== data.id).slice(0, 4)
    }
  } catch (err) {
    error.value = errorMessage(err)
  }
}
watch(() => route.params.id, load, { immediate: true })

function addToCart(goToCart = false) {
  cart.add(product.value, quantity.value)
  toast.success(`Added ${quantity.value} × ${product.value.name} to cart`)
  if (goToCart) router.push("/cart")
}
</script>

<template>
  <div class="container">
    <nav class="crumbs small">
      <RouterLink to="/products">Shop</RouterLink>
      <template v-if="product?.category">
        <span>/</span>
        <RouterLink :to="{ name: 'products', query: { category: product.category.slug } }">{{ product.category.name }}</RouterLink>
      </template>
    </nav>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-else-if="!product" class="detail">
      <div class="skeleton" style="aspect-ratio: 4/3"></div>
      <div class="skeleton" style="height: 320px"></div>
    </div>

    <template v-else>
      <div class="detail">
        <div class="card image">
          <ProductImage :product="product" />
        </div>

        <div class="info">
          <span class="brand">{{ product.brand?.name }}</span>
          <h1>{{ product.name }}</h1>
          <p class="price">{{ money(product.price) }}</p>
          <p class="desc">{{ product.description }}</p>

          <p>
            <span v-if="product.stock === 0" class="badge badge-danger">Out of stock</span>
            <span v-else-if="product.stock <= 5" class="badge badge-warn">Only {{ product.stock }} left</span>
            <span v-else class="badge badge-success">In stock</span>
          </p>

          <div v-if="product.stock > 0" class="buy">
            <div class="qty">
              <button aria-label="Less" @click="quantity = Math.max(1, quantity - 1)">−</button>
              <span>{{ quantity }}</span>
              <button aria-label="More" @click="quantity = Math.min(product.stock, quantity + 1)">+</button>
            </div>
            <button class="btn btn-outline btn-lg" @click="addToCart(false)">Add to cart</button>
            <button class="btn btn-primary btn-lg" @click="addToCart(true)">Buy now</button>
          </div>

          <ul class="meta small muted">
            <li>SKU: {{ product.sku }}</li>
            <li>Free delivery across Thailand</li>
            <li>Cancel any time before your order ships</li>
          </ul>
        </div>
      </div>

      <section v-if="related.length" class="related">
        <h2>You may also like</h2>
        <div class="grid grid-products">
          <ProductCard v-for="p in related" :key="p.id" :product="p" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.crumbs {
  display: flex;
  gap: 8px;
  padding: 24px 0;
  color: var(--muted);
}
.detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
}
.image {
  overflow: hidden;
}
.brand {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  font-size: 0.85rem;
}
.info h1 {
  font-size: 2rem;
  margin-top: 6px;
}
.price {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--brand);
  margin: 0 0 16px;
}
.desc {
  color: var(--ink-2);
  font-size: 1.05rem;
}
.buy {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 24px 0;
}
.qty {
  display: flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: #fff;
}
.qty button {
  width: 44px;
  height: 48px;
  border: 0;
  background: none;
  font-size: 1.2rem;
  cursor: pointer;
}
.qty span {
  min-width: 32px;
  text-align: center;
  font-weight: 600;
}
.meta {
  padding: 20px 0 0 18px;
  border-top: 1px solid var(--line);
}
.related {
  margin-top: 64px;
}
@media (max-width: 820px) {
  .detail { grid-template-columns: 1fr; gap: 24px; }
}
</style>
