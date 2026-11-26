<script setup>
import { ref, computed, watch } from "vue"
import api, { errorMessage } from "@/api/client"
import { useCompareStore, MAX_COMPARE } from "@/stores/compare"
import { money } from "@/utils/format"
import ProductImage from "@/components/ProductImage.vue"
import EmptyState from "@/components/EmptyState.vue"

const compare = useCompareStore()
const products = ref([])
const loading = ref(false)
const error = ref("")
const onlyDifferences = ref(false)

async function load() {
  if (!compare.ids.length) {
    products.value = []
    return
  }
  loading.value = true
  error.value = ""
  try {
    const { data } = await api.get("/products", { params: { ids: compare.ids.join(","), limit: MAX_COMPARE } })
    // Keep the order the customer added them in
    products.value = compare.ids.map((id) => data.data.find((p) => p.id === id)).filter(Boolean)
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}
watch(() => [...compare.ids], load, { immediate: true })

// Every spec name used by any of the products, in the order they first appear
const specKeys = computed(() => {
  const keys = []
  for (const p of products.value) for (const k of Object.keys(p.specs || {})) if (!keys.includes(k)) keys.push(k)
  return keys
})

const rows = computed(() => {
  const all = [
    { key: "Price", values: products.value.map((p) => `From ${money(p.price)}`) },
    { key: "Brand", values: products.value.map((p) => p.brand?.name || "—") },
    { key: "Colors", values: products.value.map((p) => p.colors.map((c) => c.name).join(", ") || "—") },
    {
      key: "Options",
      values: products.value.map((p) => {
        if (!p.sizeOptionName) return "—"
        const labels = [...new Set(p.variants.map((v) => v.sizeLabel).filter(Boolean))]
        return `${p.sizeOptionName}: ${labels.join(", ")}`
      }),
    },
    ...specKeys.value.map((k) => ({ key: k, values: products.value.map((p) => p.specs?.[k] || "—") })),
  ]
  if (!onlyDifferences.value || products.value.length < 2) return all
  return all.filter((r) => new Set(r.values).size > 1)
})
</script>

<template>
  <div class="container container-wide">
    <div class="page-header row-between">
      <div>
        <h1>Compare</h1>
        <p>See models side by side. You can compare up to {{ MAX_COMPARE }} products.</p>
      </div>
      <div v-if="products.length > 1" class="row">
        <label class="checkbox"><input v-model="onlyDifferences" type="checkbox" /> Show only differences</label>
        <button class="btn btn-ghost btn-sm" @click="compare.clear()">Clear all</button>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-else-if="loading && !products.length" class="skeleton" style="height: 480px"></div>

    <EmptyState v-else-if="!products.length" title="Nothing to compare yet" text="Tick “Compare” on any product to add it here.">
      <RouterLink to="/products" class="btn btn-primary">Browse the store</RouterLink>
    </EmptyState>

    <div v-else class="table-wrap">
      <table class="compare" :style="{ '--cols': products.length }">
        <thead>
          <tr>
            <th></th>
            <th v-for="p in products" :key="p.id" class="head">
              <button class="remove" :aria-label="`Remove ${p.name}`" @click="compare.remove(p.id)">✕</button>
              <RouterLink :to="`/products/${p.id}`" class="img-link"><ProductImage :src="p.imageUrl" :alt="p.name" /></RouterLink>
              <div class="swatches">
                <i v-for="c in p.colors" :key="c.name" class="swatch" :style="{ background: c.hex }" :title="c.name"></i>
              </div>
              <h3>{{ p.name }}</h3>
              <p class="small muted tagline">{{ p.tagline }}</p>
              <RouterLink :to="`/products/${p.id}`" class="btn btn-primary btn-sm">Buy</RouterLink>
            </th>
            <th v-if="products.length < MAX_COMPARE" class="head add">
              <RouterLink to="/products" class="add-box">
                <span>+</span>
                Add a product
              </RouterLink>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.key">
            <th scope="row">{{ r.key }}</th>
            <td v-for="(v, i) in r.values" :key="i">{{ v }}</td>
            <td v-if="products.length < MAX_COMPARE"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.compare {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 640px;
}
.compare th,
.compare td {
  text-align: left;
  vertical-align: top;
  padding: 18px 16px;
  border-bottom: 1px solid var(--line-soft);
}
.compare tbody th {
  width: 170px;
  font-weight: 600;
  font-size: 14px;
  color: var(--muted);
}
.compare thead th:first-child {
  width: 170px;
}
.head {
  position: relative;
  font-weight: 400;
}
.head h3 {
  margin: 10px 0 2px;
}
.tagline {
  min-height: 40px;
  margin: 0 0 12px;
}
.img-link {
  display: block;
  border-radius: 14px;
  overflow: hidden;
}
.swatches {
  display: flex;
  gap: 6px;
  margin-top: 12px;
}
.remove {
  position: absolute;
  top: 26px;
  right: 24px;
  z-index: 1;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 0;
  background: rgb(255 255 255 / 0.9);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  color: var(--muted);
}
.add-box {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 6px;
  aspect-ratio: 4 / 3;
  border: 2px dashed var(--line);
  border-radius: 14px;
  color: var(--muted);
  font-size: 14px;
  text-decoration: none !important;
}
.add-box span {
  font-size: 36px;
  line-height: 1;
}
</style>
