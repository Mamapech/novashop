<script setup>
import { ref, computed, onMounted } from "vue"
import api, { errorMessage, imageUrl } from "@/api/client"
import { money } from "@/utils/format"

const featured = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref("")

// Picture shown for each category in the "Shop by category" row
const CATEGORY_IMAGES = {
  laptops: "/images/products/lap-001-silver.svg",
  audio: "/images/products/aud-001-white.svg",
  accessories: "/images/products/acc-001-white.svg",
  "smart-home": "/images/products/smh-002-white.svg",
  wearables: "/images/products/wea-002-silver.svg",
}

onMounted(async () => {
  try {
    const [products, cats] = await Promise.all([
      api.get("/products", { params: { featured: true, limit: 8, sort: "featured" } }),
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

// First two featured products get full-width banners, the rest go in a 2-column grid
const hero = computed(() => featured.value[0])
const heroDark = computed(() => featured.value[1])
const tiles = computed(() => featured.value.slice(2))
const fromPrice = (p) => `From ${money(p.price)}`
</script>

<template>
  <div v-if="error" class="container" style="padding-top: 24px">
    <div class="alert alert-error">Could not load the store: {{ error }}. Is the API running?</div>
  </div>

  <!-- Category navigation -->
  <section class="container container-wide store-nav">
    <h1 class="store-title">Store. <span class="muted">The best way to buy the tech you love.</span></h1>
    <div class="cats">
      <RouterLink
        v-for="c in categories"
        :key="c.id"
        :to="{ name: 'products', query: { category: c.slug } }"
        class="cat"
      >
        <img :src="imageUrl(CATEGORY_IMAGES[c.slug])" :alt="''" />
        <span>{{ c.name }}</span>
      </RouterLink>
    </div>
  </section>

  <template v-if="loading">
    <div class="container container-wide"><div class="skeleton" style="height: 520px"></div></div>
  </template>

  <template v-else-if="hero">
    <!-- Hero banner -->
    <section class="banner fade-in">
      <span class="eyebrow">New</span>
      <h2 class="banner-title">{{ hero.name }}</h2>
      <p class="banner-tagline">{{ hero.tagline }}</p>
      <p class="muted">{{ fromPrice(hero) }}</p>
      <div class="banner-links">
        <RouterLink :to="`/products/${hero.id}`" class="btn btn-primary">Buy</RouterLink>
        <RouterLink :to="`/products/${hero.id}#specs`" class="chevron-link">Learn more</RouterLink>
      </div>
      <RouterLink :to="`/products/${hero.id}`" class="banner-img"><img :src="imageUrl(hero.imageUrl)" :alt="hero.name" /></RouterLink>
    </section>

    <!-- Dark banner -->
    <section v-if="heroDark" class="banner dark fade-in">
      <h2 class="banner-title">{{ heroDark.name }}</h2>
      <p class="banner-tagline">{{ heroDark.tagline }}</p>
      <p class="muted-dark">{{ fromPrice(heroDark) }}</p>
      <div class="banner-links">
        <RouterLink :to="`/products/${heroDark.id}`" class="btn btn-primary">Buy</RouterLink>
        <RouterLink :to="`/products/${heroDark.id}#specs`" class="chevron-link light-link">Learn more</RouterLink>
      </div>
      <RouterLink :to="`/products/${heroDark.id}`" class="banner-img"><img :src="imageUrl(heroDark.imageUrl)" :alt="heroDark.name" /></RouterLink>
    </section>

    <!-- 2-column tiles -->
    <section class="tiles">
      <article v-for="p in tiles" :key="p.id" class="tile fade-in">
        <h3 class="tile-title">{{ p.name }}</h3>
        <p class="tile-tagline">{{ p.tagline }}</p>
        <div class="banner-links">
          <RouterLink :to="`/products/${p.id}`" class="btn btn-primary btn-sm">Buy</RouterLink>
          <RouterLink :to="`/products/${p.id}#specs`" class="chevron-link">Learn more</RouterLink>
        </div>
        <RouterLink :to="`/products/${p.id}`" class="tile-img"><img :src="imageUrl(p.imageUrl)" :alt="p.name" loading="lazy" /></RouterLink>
      </article>
    </section>
  </template>

  <!-- Reasons to buy -->
  <section class="container container-wide why">
    <h2>Why buy from NovaShop. <span class="muted">Simple from start to finish.</span></h2>
    <div class="why-grid">
      <div class="why-card">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#0071e3" stroke-width="1.8"><path d="M3 10h20v14H3zM23 15h6l4 5v4h-10z" /><circle cx="9" cy="26" r="3" fill="#fff" /><circle cx="27" cy="26" r="3" fill="#fff" /></svg>
        <h3>Free delivery</h3>
        <p class="muted">Every order ships free, anywhere in Thailand.</p>
      </div>
      <div class="why-card">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#1d8a3a" stroke-width="1.8"><path d="M18 3l12 5v9c0 8-5 13-12 16C11 30 6 25 6 17V8z" /><path d="M12 18l4 4 8-8" /></svg>
        <h3>Secure checkout</h3>
        <p class="muted">Your account and orders are protected.</p>
      </div>
      <div class="why-card">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#b25000" stroke-width="1.8"><circle cx="18" cy="18" r="14" /><path d="M18 10v8l5 4" /></svg>
        <h3>Change your mind</h3>
        <p class="muted">Cancel any order before it ships, at no cost.</p>
      </div>
      <div class="why-card">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#5e5ce6" stroke-width="1.8"><rect x="4" y="6" width="11" height="24" rx="2" /><rect x="21" y="6" width="11" height="24" rx="2" /></svg>
        <h3>Compare models</h3>
        <p class="muted">See specs side by side before you decide.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.store-nav {
  padding-top: 48px;
}
.store-title {
  font-size: 48px;
  max-width: 640px;
  margin-bottom: 36px;
}
.cats {
  display: flex;
  gap: 28px;
  overflow-x: auto;
  padding-bottom: 24px;
  scrollbar-width: none;
}
.cat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 110px;
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none !important;
}
.cat img {
  width: 110px;
  height: 78px;
  object-fit: cover;
  border-radius: 12px;
  transition: transform 0.3s;
}
.cat:hover img {
  transform: scale(1.06);
}

.banner {
  text-align: center;
  padding: 56px 22px 0;
  background: var(--bg-alt);
  margin-top: 12px;
  overflow: hidden;
}
.banner.dark {
  background: #000;
  color: #f5f5f7;
}
.banner-title {
  font-size: 56px;
  margin: 4px 0 6px;
}
.banner-tagline {
  font-size: 28px;
  font-weight: 400;
  margin: 0 0 6px;
  letter-spacing: 0.007em;
}
.muted-dark {
  color: #a1a1a6;
}
.banner-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin: 18px 0 8px;
}
.light-link {
  color: #2997ff;
}
.banner-img {
  display: block;
  max-width: 760px;
  margin: 0 auto;
}
.banner-img img {
  mix-blend-mode: multiply;
  width: 100%;
  border-radius: 24px 24px 0 0;
  transition: transform 0.6s ease;
}
.banner-img:hover img {
  transform: scale(1.02);
}
.dark .banner-img img {
  mix-blend-mode: normal;
}

.tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px;
}
.tile {
  background: var(--bg-alt);
  text-align: center;
  padding: 48px 24px 0;
  overflow: hidden;
  min-height: 520px;
  display: flex;
  flex-direction: column;
}
.tile-title {
  font-size: 40px;
  margin: 0 0 4px;
}
.tile-tagline {
  font-size: 21px;
  margin: 0;
}
.tile-img {
  margin-top: auto;
  display: block;
}
.tile-img img {
  mix-blend-mode: multiply; /* blends the picture's light background into the gray tile */
  width: 100%;
  max-width: 480px;
  margin: 12px auto 0;
  transition: transform 0.6s ease;
}
.tile:hover .tile-img img {
  transform: scale(1.03);
}

.why {
  padding-top: 72px;
}
.why h2 {
  font-size: 32px;
  margin-bottom: 28px;
}
.why-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.why-card {
  background: #fff;
  border-radius: var(--radius);
  box-shadow: 2px 4px 12px rgb(0 0 0 / 0.08);
  padding: 28px;
}
.why-card h3 {
  margin: 16px 0 6px;
  font-size: 19px;
}
.why-card p {
  margin: 0;
  font-size: 15px;
}

@media (max-width: 1023px) {
  .why-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 734px) {
  .store-title { font-size: 32px; }
  .banner-title { font-size: 40px; }
  .banner-tagline { font-size: 21px; }
  .tiles { grid-template-columns: 1fr; }
  .tile { min-height: 440px; }
  .tile-title { font-size: 32px; }
  .why-grid { grid-template-columns: 1fr; }
}
</style>
