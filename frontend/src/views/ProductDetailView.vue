<script setup>
import { ref, computed, watch, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import api, { errorMessage } from "@/api/client"
import { useCartStore } from "@/stores/cart"
import { useCompareStore, MAX_COMPARE } from "@/stores/compare"
import { useToastStore } from "@/stores/toast"
import { money } from "@/utils/format"
import ProductImage from "@/components/ProductImage.vue"
import ProductCard from "@/components/ProductCard.vue"

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const compare = useCompareStore()
const toast = useToastStore()

const product = ref(null)
const related = ref([])
const error = ref("")

const color = ref(null)
const size = ref(null)
const quantity = ref(1)

// ---------- Options ----------
const colors = computed(() => product.value?.colors || [])
const sizes = computed(() => {
  if (!product.value?.sizeOptionName) return []
  const labels = []
  for (const v of product.value.variants) if (v.sizeLabel && !labels.includes(v.sizeLabel)) labels.push(v.sizeLabel)
  return labels
})

function findVariant(c, s) {
  return product.value?.variants.find((v) => (v.colorName || null) === (c || null) && (v.sizeLabel || null) === (s || null))
}
const variant = computed(() => findVariant(color.value, size.value))

// Price and stock shown on each size button, for the chosen color
const sizeInfo = (s) => findVariant(color.value, s)
const colorInStock = (c) => product.value.variants.some((v) => v.colorName === c && v.stock > 0)

const image = computed(() => variant.value?.imageUrl || colors.value.find((c) => c.name === color.value)?.imageUrl || product.value?.imageUrl)
const label = computed(() => [color.value, size.value].filter(Boolean).join(", "))

// When the color changes, keep the size if it exists in that color, otherwise pick the first one in stock
watch(color, (c) => {
  if (!sizes.value.length) return
  const current = findVariant(c, size.value)
  if (!current || current.stock === 0) {
    size.value = sizes.value.find((s) => findVariant(c, s)?.stock > 0) || sizes.value[0]
  }
  quantity.value = 1
})

// ---------- Loading ----------
async function load() {
  product.value = null
  error.value = ""
  quantity.value = 1
  try {
    const { data } = await api.get(`/products/${route.params.id}`)
    product.value = data
    // Start with the first color that is in stock
    color.value = (data.colors.find((c) => colorInStock(c.name)) || data.colors[0])?.name || null
    size.value = sizes.value.find((s) => findVariant(color.value, s)?.stock > 0) || sizes.value[0] || null

    if (route.hash) {
      await nextTick()
      document.querySelector(route.hash)?.scrollIntoView({ behavior: "smooth" })
    }
    if (data.category) {
      const res = await api.get("/products", { params: { category: data.category.slug, limit: 5 } })
      related.value = res.data.data.filter((p) => p.id !== data.id).slice(0, 3)
    }
  } catch (err) {
    error.value = errorMessage(err)
  }
}
watch(() => route.params.id, load, { immediate: true })

// ---------- Actions ----------
function addToCart(goToCart = false) {
  cart.add(product.value, variant.value, quantity.value)
  toast.success(`Added ${product.value.name} (${label.value}) to your cart`)
  if (goToCart) router.push("/cart")
}

function toggleCompare() {
  if (!compare.toggle(product.value.id)) toast.error(`You can compare up to ${MAX_COMPARE} products`)
}

const SIZE_QUESTIONS = {
  Storage: "How much space do you need?",
  "Case size": "Which case size fits you?",
  "Ring size": "What's your ring size?",
}
</script>

<template>
  <div v-if="error" class="container" style="padding-top: 40px">
    <div class="alert alert-error">{{ error }}</div>
  </div>

  <div v-else-if="!product" class="container container-wide buy" style="padding-top: 56px">
    <div class="skeleton" style="aspect-ratio: 4/3"></div>
    <div class="skeleton" style="height: 420px"></div>
  </div>

  <template v-else>
    <div class="container container-wide">
      <nav class="crumbs small">
        <RouterLink to="/products">Store</RouterLink>
        <template v-if="product.category">
          <span>›</span>
          <RouterLink :to="{ name: 'products', query: { category: product.category.slug } }">{{ product.category.name }}</RouterLink>
        </template>
      </nav>

      <header class="title fade-in">
        <span v-if="product.isFeatured" class="eyebrow">New</span>
        <h1>Buy {{ product.name }}</h1>
        <p class="muted">{{ sizes.length || colors.length > 1 ? "From " : "" }}{{ money(product.price) }}</p>
      </header>

      <div class="buy">
        <!-- Gallery -->
        <div class="gallery">
          <div class="main-image">
            <Transition name="swap" mode="out-in">
              <ProductImage :key="image" :src="image" :alt="`${product.name} in ${color}`" />
            </Transition>
          </div>
          <div v-if="colors.length > 1" class="thumbs">
            <button
              v-for="c in colors"
              :key="c.name"
              class="thumb"
              :class="{ active: c.name === color }"
              :aria-label="`Show ${c.name}`"
              @click="color = c.name"
            >
              <ProductImage :src="c.imageUrl" :alt="c.name" />
            </button>
          </div>
        </div>

        <!-- Options -->
        <div class="options">
          <p class="lede">{{ product.tagline }}</p>

          <section v-if="colors.length" class="step">
            <h3>Color. <span class="muted">Pick your favorite.</span></h3>
            <p class="small">Color – <strong>{{ color }}</strong></p>
            <div class="swatches">
              <button
                v-for="c in colors"
                :key="c.name"
                class="big-swatch"
                :class="{ active: c.name === color, out: !colorInStock(c.name) }"
                :style="{ '--c': c.hex }"
                :title="colorInStock(c.name) ? c.name : `${c.name} (sold out)`"
                :aria-label="c.name"
                :aria-pressed="c.name === color"
                @click="color = c.name"
              ></button>
            </div>
          </section>

          <section v-if="sizes.length" class="step">
            <h3>{{ product.sizeOptionName }}. <span class="muted">{{ SIZE_QUESTIONS[product.sizeOptionName] || "Choose an option." }}</span></h3>
            <div class="size-grid">
              <button
                v-for="s in sizes"
                :key="s"
                class="size"
                :class="{ active: s === size }"
                :disabled="!sizeInfo(s) || sizeInfo(s).stock === 0"
                @click="size = s"
              >
                <strong>{{ s }}</strong>
                <span class="small muted">
                  {{ !sizeInfo(s) ? "Not available" : sizeInfo(s).stock === 0 ? "Sold out" : money(sizeInfo(s).price) }}
                </span>
              </button>
            </div>
          </section>

          <!-- Summary -->
          <section class="summary card-flat">
            <template v-if="variant">
              <div class="row-between">
                <div>
                  <strong>{{ product.name }}</strong>
                  <div class="small muted">{{ label }}</div>
                </div>
                <strong class="price">{{ money(variant.price) }}</strong>
              </div>

              <p class="small stock">
                <span v-if="variant.stock === 0" class="badge badge-danger">Sold out</span>
                <span v-else-if="variant.stock <= 5" class="badge badge-warn">Only {{ variant.stock }} left</span>
                <span v-else class="in-stock">● In stock · Free delivery in 2–3 days</span>
              </p>

              <div v-if="variant.stock > 0" class="buy-row">
                <div class="qty" aria-label="Quantity">
                  <button aria-label="Less" :disabled="quantity <= 1" @click="quantity--">−</button>
                  <span>{{ quantity }}</span>
                  <button aria-label="More" :disabled="quantity >= Math.min(variant.stock, 20)" @click="quantity++">+</button>
                </div>
                <button class="btn btn-primary btn-lg grow" @click="addToCart(false)">Add to Cart</button>
              </div>
              <button v-if="variant.stock > 0" class="btn btn-ghost btn-block" @click="addToCart(true)">Buy now ›</button>
            </template>
            <p v-else class="muted">This combination isn't available. Try another option.</p>
          </section>

          <label class="compare small">
            <input type="checkbox" :checked="compare.has(product.id)" @change="toggleCompare" />
            Add to compare
            <RouterLink v-if="compare.ids.length > 1" to="/compare" class="chevron-link">Compare now</RouterLink>
          </label>
        </div>
      </div>
    </div>

    <!-- Overview + tech specs -->
    <section id="specs" class="specs-section">
      <div class="container">
        <h2>Overview</h2>
        <p class="overview">{{ product.description }}</p>

        <h2 class="specs-title">Tech Specs</h2>
        <dl class="specs">
          <template v-for="(value, key) in product.specs" :key="key">
            <dt>{{ key }}</dt>
            <dd>{{ value }}</dd>
          </template>
          <template v-if="colors.length">
            <dt>Colors</dt>
            <dd class="spec-colors">
              <span v-for="c in colors" :key="c.name"><i class="swatch" :style="{ background: c.hex }"></i> {{ c.name }}</span>
            </dd>
          </template>
          <dt>Brand</dt>
          <dd>{{ product.brand?.name }}</dd>
          <dt>Model</dt>
          <dd>{{ product.sku }}</dd>
        </dl>
      </div>
    </section>

    <section v-if="related.length" class="container container-wide related">
      <h2>You may also like</h2>
      <div class="grid grid-products">
        <ProductCard v-for="p in related" :key="p.id" :product="p" />
      </div>
    </section>
  </template>
</template>

<style scoped>
.crumbs {
  display: flex;
  gap: 8px;
  padding: 20px 0 0;
  color: var(--muted);
}
.title {
  padding: 28px 0 32px;
}
.title h1 {
  margin: 2px 0 6px;
}
.title p {
  margin: 0;
}
.buy {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 56px;
  align-items: start;
}
.gallery {
  position: sticky;
  top: 72px;
}
.main-image {
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--bg-alt);
}
.thumbs {
  display: flex;
  gap: 12px;
  margin-top: 14px;
}
.thumb {
  width: 84px;
  border: 2px solid transparent;
  border-radius: 12px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  background: none;
  transition: border-color 0.2s;
}
.thumb.active {
  border-color: var(--brand);
}
.lede {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
  margin: 0 0 8px;
  letter-spacing: 0.004em;
}
.step {
  padding: 28px 0;
  border-bottom: 1px solid var(--line-soft);
}
.step h3 {
  font-size: 19px;
  margin-bottom: 14px;
}
.swatches {
  display: flex;
  gap: 14px;
  margin-top: 10px;
}
.big-swatch {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 0;
  padding: 0;
  background: var(--c);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.15);
  cursor: pointer;
  position: relative;
  outline-offset: 3px;
}
.big-swatch.active {
  outline: 2px solid var(--brand);
}
.big-swatch.out::after {
  content: "";
  position: absolute;
  inset: 15px -2px;
  background: var(--muted);
  transform: rotate(-45deg);
  border-radius: 2px;
}
.size-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.size {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 16px 18px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.size:hover:not(:disabled) {
  border-color: var(--muted);
}
.size.active {
  border-color: var(--brand);
  box-shadow: 0 0 0 1px var(--brand);
}
.size:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.summary {
  margin-top: 28px;
  padding: 24px;
}
.price {
  font-size: 21px;
}
.stock {
  margin: 12px 0 18px;
}
.in-stock {
  color: var(--success);
}
.buy-row {
  display: flex;
  gap: 12px;
}
.grow {
  flex: 1;
}
.qty {
  display: flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 980px;
  background: #fff;
}
.qty button {
  width: 40px;
  height: 48px;
  border: 0;
  background: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--ink);
}
.qty button:disabled {
  color: var(--line);
  cursor: default;
}
.qty span {
  min-width: 22px;
  text-align: center;
  font-weight: 600;
}
.compare {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  color: var(--ink-2);
  cursor: pointer;
}
.compare input {
  accent-color: var(--brand);
}
.specs-section {
  background: var(--bg-alt);
  margin-top: 80px;
  padding: 64px 0;
  scroll-margin-top: 48px;
}
.overview {
  font-size: 21px;
  color: var(--ink-2);
  max-width: 760px;
}
.specs-title {
  margin-top: 48px;
}
.specs {
  display: grid;
  grid-template-columns: 220px 1fr;
  margin: 0;
  border-top: 1px solid var(--line);
}
.specs dt,
.specs dd {
  margin: 0;
  padding: 18px 0;
  border-bottom: 1px solid var(--line);
}
.specs dt {
  font-weight: 600;
}
.spec-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.spec-colors span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.related {
  padding-top: 64px;
}
.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.2s ease;
}
.swap-enter-from,
.swap-leave-to {
  opacity: 0;
}
@media (max-width: 860px) {
  .buy { grid-template-columns: 1fr; gap: 16px; }
  .gallery { position: static; }
  .specs { grid-template-columns: 1fr; }
  .specs dt { border-bottom: 0; padding-bottom: 0; }
  .specs dd { padding-top: 4px; }
}
</style>
