<script setup>
import { ref, reactive, watch, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import api, { errorMessage } from "@/api/client"
import ProductCard from "@/components/ProductCard.vue"
import PaginationBar from "@/components/PaginationBar.vue"
import EmptyState from "@/components/EmptyState.vue"

const route = useRoute()
const router = useRouter()

const products = ref([])
const pagination = ref({ page: 1, totalPages: 1, total: 0 })
const categories = ref([])
const brands = ref([])
const loading = ref(true)
const error = ref("")

// The filters live in the URL (?category=audio&sort=price_asc), so links can be shared
const filters = reactive({})
function readFiltersFromUrl() {
  const q = route.query
  Object.assign(filters, {
    q: q.q || "",
    category: q.category || "",
    brand: q.brand || "",
    minPrice: q.minPrice || "",
    maxPrice: q.maxPrice || "",
    inStock: q.inStock === "true",
    featured: q.featured === "true",
    sort: q.sort || "newest",
    page: Number(q.page) || 1,
  })
}

function applyFilters(changes = {}) {
  const next = { ...filters, page: 1, ...changes }
  // Remove empty values so the URL stays clean
  const query = Object.fromEntries(
    Object.entries(next).filter(([k, v]) => v !== "" && v !== false && !(k === "sort" && v === "newest") && !(k === "page" && v === 1))
  )
  router.push({ query })
}

function clearFilters() {
  router.push({ query: {} })
}

async function load() {
  loading.value = true
  error.value = ""
  try {
    const params = { ...filters, limit: 12 }
    Object.keys(params).forEach((k) => (params[k] === "" || params[k] === false) && delete params[k])
    const { data } = await api.get("/products", { params })
    products.value = data.data
    pagination.value = data.pagination
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}

watch(
  () => route.query,
  () => {
    readFiltersFromUrl()
    load()
  },
  { immediate: true }
)

onMounted(async () => {
  const [c, b] = await Promise.all([api.get("/categories"), api.get("/brands")])
  categories.value = c.data
  brands.value = b.data
})
</script>

<template>
  <div class="container">
    <div class="page-header row-between">
      <div>
        <h1>{{ filters.q ? `Results for "${filters.q}"` : "All products" }}</h1>
        <p>{{ pagination.total }} products</p>
      </div>
      <div class="row">
        <label for="sort" class="muted small">Sort by</label>
        <select id="sort" class="select sort" :value="filters.sort" @change="applyFilters({ sort: $event.target.value })">
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>
    </div>

    <div class="layout">
      <aside class="filters card">
        <div class="card-body stack">
          <div class="row-between">
            <strong>Filters</strong>
            <button class="btn btn-ghost btn-sm" @click="clearFilters">Clear all</button>
          </div>

          <div class="field">
            <label>Category</label>
            <button
              class="chip"
              :class="{ active: !filters.category }"
              @click="applyFilters({ category: '' })"
            >All</button>
            <button
              v-for="c in categories"
              :key="c.id"
              class="chip"
              :class="{ active: filters.category === c.slug }"
              @click="applyFilters({ category: c.slug })"
            >
              {{ c.name }} <span class="muted">{{ c.productCount }}</span>
            </button>
          </div>

          <div class="field">
            <label for="brand">Brand</label>
            <select id="brand" class="select" :value="filters.brand" @change="applyFilters({ brand: $event.target.value })">
              <option value="">All brands</option>
              <option v-for="b in brands" :key="b.id" :value="String(b.id)">{{ b.name }}</option>
            </select>
          </div>

          <form class="field" @submit.prevent="applyFilters()">
            <label>Price (฿)</label>
            <div class="row">
              <input v-model="filters.minPrice" class="input" type="number" min="0" placeholder="Min" />
              <input v-model="filters.maxPrice" class="input" type="number" min="0" placeholder="Max" />
            </div>
            <button class="btn btn-outline btn-sm">Apply price</button>
          </form>

          <label class="checkbox">
            <input type="checkbox" :checked="filters.inStock" @change="applyFilters({ inStock: $event.target.checked })" />
            In stock only
          </label>
          <label class="checkbox">
            <input type="checkbox" :checked="filters.featured" @change="applyFilters({ featured: $event.target.checked })" />
            Featured only
          </label>
        </div>
      </aside>

      <section>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-else-if="loading" class="grid grid-products">
          <div v-for="n in 6" :key="n" class="skeleton" style="height: 300px"></div>
        </div>
        <EmptyState
          v-else-if="!products.length"
          title="No products found"
          text="Try a different search or remove some filters."
        >
          <button class="btn btn-primary" @click="clearFilters">Clear filters</button>
        </EmptyState>
        <template v-else>
          <div class="grid grid-products">
            <ProductCard v-for="p in products" :key="p.id" :product="p" />
          </div>
          <PaginationBar
            :page="pagination.page"
            :total-pages="pagination.totalPages"
            @change="(n) => applyFilters({ page: n })"
          />
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 28px;
  align-items: start;
}
.filters {
  position: sticky;
  top: 88px;
}
.sort {
  width: auto;
}
.chip {
  display: flex;
  justify-content: space-between;
  padding: 7px 10px;
  border: 0;
  background: none;
  border-radius: 6px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  color: var(--ink-2);
}
.chip:hover {
  background: var(--bg);
}
.chip.active {
  background: var(--brand-soft);
  color: var(--brand);
  font-weight: 600;
}
@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
  .filters { position: static; }
}
</style>
