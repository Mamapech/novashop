<script setup>
import { ref, onMounted } from "vue"
import api, { errorMessage } from "@/api/client"
import ProductCard from "@/components/ProductCard.vue"

const featured = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref("")

onMounted(async () => {
  try {
    const [products, cats] = await Promise.all([
      api.get("/products", { params: { featured: true, limit: 8 } }),
      api.get("/categories"),
    ])
    featured.value = products.data.data
    categories.value = cats.data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="hero">
    <div class="container hero-inner">
      <div class="hero-text">
        <span class="badge">New season deals</span>
        <h1>Tech you'll love, at prices that make sense.</h1>
        <p>Laptops, audio, wearables and smart home gear from brands you trust. Free delivery on every order.</p>
        <div class="row">
          <RouterLink to="/products" class="btn btn-primary btn-lg">Shop now</RouterLink>
          <RouterLink to="/products?featured=true" class="btn btn-outline btn-lg">See featured</RouterLink>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="hero-card card">
          <span class="muted small">Today's pick</span>
          <strong>Lumen Buds Pro</strong>
          <span class="price">฿3,490</span>
        </div>
      </div>
    </div>
  </section>

  <div class="container">
    <div v-if="error" class="alert alert-error">Could not load the shop: {{ error }}. Is the API running?</div>

    <section class="section">
      <div class="row-between">
        <h2>Shop by category</h2>
      </div>
      <div class="grid categories">
        <RouterLink
          v-for="c in categories"
          :key="c.id"
          :to="{ name: 'products', query: { category: c.slug } }"
          class="category card"
        >
          <strong>{{ c.name }}</strong>
          <span class="muted small">{{ c.productCount }} products</span>
        </RouterLink>
      </div>
    </section>

    <section class="section">
      <div class="row-between">
        <h2>Featured products</h2>
        <RouterLink to="/products">View all →</RouterLink>
      </div>
      <div class="grid grid-products">
        <template v-if="loading">
          <div v-for="n in 4" :key="n" class="skeleton" style="height: 300px"></div>
        </template>
        <ProductCard v-for="p in featured" :key="p.id" :product="p" />
      </div>
    </section>

    <section class="section perks">
      <div class="perk card"><strong>Free delivery</strong><span class="muted small">On every order, nationwide</span></div>
      <div class="perk card"><strong>Secure checkout</strong><span class="muted small">Your account is protected with JWT</span></div>
      <div class="perk card"><strong>Easy cancellation</strong><span class="muted small">Cancel any order before it ships</span></div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 60%);
  border-bottom: 1px solid var(--line);
}
.hero-inner {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  gap: 40px;
  padding-top: 72px;
  padding-bottom: 72px;
}
.hero h1 {
  font-size: clamp(2rem, 4vw, 3.1rem);
  margin: 16px 0;
}
.hero p {
  font-size: 1.1rem;
  color: var(--ink-2);
  margin: 0 0 28px;
  max-width: 520px;
}
.hero-art {
  position: relative;
  height: 300px;
}
.blob {
  position: absolute;
  border-radius: 40% 60% 55% 45%;
  filter: blur(2px);
}
.b1 {
  inset: 10% 20% 5% 10%;
  background: linear-gradient(135deg, #818cf8, #4f46e5);
}
.b2 {
  width: 140px;
  height: 140px;
  right: 6%;
  top: 0;
  background: linear-gradient(135deg, #67e8f9, #0891b2);
}
.hero-card {
  position: absolute;
  left: 0;
  bottom: 12%;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
}
.hero-card .price {
  color: var(--brand);
  font-weight: 700;
}
.section {
  margin-top: 56px;
}
.categories {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}
.category {
  padding: 20px;
  display: flex;
  flex-direction: column;
  color: var(--ink);
  text-decoration: none !important;
  transition: border-color 0.15s, transform 0.15s;
}
.category:hover {
  border-color: var(--brand);
  transform: translateY(-2px);
}
.perks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}
.perk {
  padding: 20px;
  display: flex;
  flex-direction: column;
}
@media (max-width: 820px) {
  .hero-inner { grid-template-columns: 1fr; padding-top: 40px; padding-bottom: 40px; }
  .hero-art { display: none; }
}
</style>
