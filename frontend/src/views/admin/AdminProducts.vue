<script setup>
import { ref, reactive, computed, onMounted } from "vue"
import api, { errorMessage } from "@/api/client"
import { useToastStore } from "@/stores/toast"
import { money } from "@/utils/format"
import ProductImage from "@/components/ProductImage.vue"

const toast = useToastStore()
const products = ref([])
const brands = ref([])
const categories = ref([])
const search = ref("")
const loading = ref(true)

// The add/edit form shown in a side panel
const editing = ref(null) // null = closed, {} = new product, {id: ...} = existing
const form = reactive({})
const specs = ref([]) // [{ key, value }]
const variants = ref([]) // [{ id?, colorName, colorHex, sizeLabel, price, stock }]
const images = reactive({}) // color name -> File chosen for upload
const saving = ref(false)
const formError = ref("")

async function load() {
  loading.value = true
  try {
    const { data } = await api.get("/products", { params: { q: search.value || undefined, limit: 50, sort: "name" } })
    products.value = data.data
  } catch (err) {
    toast.error(errorMessage(err))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const [b, c] = await Promise.all([api.get("/brands"), api.get("/categories")])
  brands.value = b.data
  categories.value = c.data
  load()
})

async function openForm(product = null) {
  formError.value = ""
  Object.keys(images).forEach((k) => delete images[k])
  // The list doesn't include variants, so fetch the full product
  const full = product ? (await api.get(`/products/${product.id}`)).data : {}
  editing.value = full
  Object.assign(form, {
    sku: full.sku || "",
    name: full.name || "",
    tagline: full.tagline || "",
    description: full.description || "",
    sizeOptionName: full.sizeOptionName || "",
    isFeatured: full.isFeatured || false,
    brandId: full.brand?.id || "",
    categoryId: full.category?.id || "",
  })
  specs.value = Object.entries(full.specs || {}).map(([key, value]) => ({ key, value }))
  variants.value = (full.variants || [{ colorName: "", colorHex: "#1d1d1f", sizeLabel: "", price: "", stock: 0 }]).map((v) => ({ ...v }))
}

function addVariant() {
  const last = variants.value[variants.value.length - 1] || {}
  variants.value.push({ colorName: last.colorName || "", colorHex: last.colorHex || "#1d1d1f", sizeLabel: "", price: last.price || "", stock: 0 })
}

// One picture per color
const colorNames = computed(() => [...new Set(variants.value.map((v) => v.colorName).filter(Boolean))])

async function save() {
  saving.value = true
  formError.value = ""
  try {
    const body = {
      ...form,
      specs: Object.fromEntries(specs.value.filter((s) => s.key.trim()).map((s) => [s.key.trim(), s.value])),
      variants: variants.value.map((v) => ({ ...v, sizeLabel: form.sizeOptionName ? v.sizeLabel : null })),
    }
    const { data } = editing.value.id
      ? await api.put(`/products/${editing.value.id}`, body)
      : await api.post("/products", body)

    for (const [color, file] of Object.entries(images)) {
      const upload = new FormData()
      upload.append("image", file)
      if (color !== "*") upload.append("color", color)
      await api.post(`/products/${data.id}/image`, upload)
    }

    toast.success(editing.value.id ? "Product updated" : "Product created")
    editing.value = null
    load()
  } catch (err) {
    formError.value = errorMessage(err)
  } finally {
    saving.value = false
  }
}

async function remove(product) {
  if (!confirm(`Delete "${product.name}" and all its variants? This cannot be undone.`)) return
  try {
    await api.delete(`/products/${product.id}`)
    toast.success("Product deleted")
    load()
  } catch (err) {
    toast.error(errorMessage(err))
  }
}
</script>

<template>
  <div>
    <div class="row-between head">
      <h1>Products</h1>
      <div class="row">
        <form @submit.prevent="load"><input v-model="search" class="input search" placeholder="Search" /></form>
        <button class="btn btn-primary btn-sm" @click="openForm()">+ New product</button>
      </div>
    </div>

    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr><th>Product</th><th>Category</th><th>From</th><th>Stock</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="5" class="muted">Loading...</td></tr>
          <tr v-for="p in products" :key="p.id">
            <td>
              <div class="row">
                <div class="thumb"><ProductImage :src="p.imageUrl" :alt="p.name" /></div>
                <div>
                  <strong>{{ p.name }}</strong>
                  <div class="row small muted swatch-row">
                    {{ p.sku }}
                    <i v-for="c in p.colors" :key="c.name" class="swatch" :style="{ background: c.hex }" :title="c.name"></i>
                    <span v-if="p.isFeatured" class="badge badge-info">Featured</span>
                  </div>
                </div>
              </div>
            </td>
            <td>{{ p.category?.name }}</td>
            <td>{{ money(p.price) }}</td>
            <td>
              <span class="badge" :class="p.stock === 0 ? 'badge-danger' : p.stock <= 10 ? 'badge-warn' : 'badge-success'">{{ p.stock }}</span>
            </td>
            <td class="actions">
              <button class="btn btn-ghost btn-sm" @click="openForm(p)">Edit</button>
              <button class="btn btn-danger btn-sm" @click="remove(p)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Side panel form -->
    <Transition name="slide">
      <div v-if="editing" class="overlay" @click.self="editing = null">
        <form class="panel" @submit.prevent="save">
          <div class="row-between">
            <h2>{{ editing.id ? "Edit product" : "New product" }}</h2>
            <button type="button" class="btn btn-ghost btn-sm" @click="editing = null">Close</button>
          </div>

          <h4>Basics</h4>
          <div class="two">
            <div class="field"><label>Model SKU</label><input v-model.trim="form.sku" class="input" required placeholder="ACC-010" /></div>
            <div class="field"><label>Name</label><input v-model.trim="form.name" class="input" required /></div>
          </div>
          <div class="field"><label>Tagline</label><input v-model.trim="form.tagline" class="input" placeholder="A short, catchy line" /></div>
          <div class="field"><label>Description</label><textarea v-model="form.description" class="textarea"></textarea></div>
          <div class="two">
            <div class="field">
              <label>Brand</label>
              <select v-model="form.brandId" class="select">
                <option value="">None</option>
                <option v-for="b in brands" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </div>
            <div class="field">
              <label>Category</label>
              <select v-model="form.categoryId" class="select">
                <option value="">None</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>
          <label class="checkbox"><input v-model="form.isFeatured" type="checkbox" /> Feature on the home page</label>

          <h4>Options and stock</h4>
          <div class="field">
            <label>Second option name (leave empty if only colors)</label>
            <input v-model.trim="form.sizeOptionName" class="input" placeholder="e.g. Storage, Case size, Ring size" />
          </div>
          <div class="variants">
            <div class="variant head-row small muted">
              <span>Color</span><span>Name</span><span v-if="form.sizeOptionName">{{ form.sizeOptionName }}</span><span>Price ฿</span><span>Stock</span><span></span>
            </div>
            <div v-for="(v, i) in variants" :key="i" class="variant" :class="{ 'no-size': !form.sizeOptionName }">
              <input v-model="v.colorHex" type="color" class="color" :aria-label="`Variant ${i + 1} color`" />
              <input v-model.trim="v.colorName" class="input sm" placeholder="Silver" />
              <input v-if="form.sizeOptionName" v-model.trim="v.sizeLabel" class="input sm" placeholder="256GB" />
              <input v-model.number="v.price" type="number" min="0" step="0.01" class="input sm" required />
              <input v-model.number="v.stock" type="number" min="0" step="1" class="input sm" />
              <button type="button" class="btn btn-ghost btn-sm" :disabled="variants.length === 1" aria-label="Remove variant" @click="variants.splice(i, 1)">✕</button>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" @click="addVariant">+ Add variant</button>
          </div>

          <h4>Pictures</h4>
          <div v-for="c in colorNames.length ? colorNames : ['*']" :key="c" class="field">
            <label>{{ c === "*" ? "Product picture" : `${c} picture` }}</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" class="input sm" @change="images[c] = $event.target.files[0]" />
          </div>

          <h4>Tech specs</h4>
          <div v-for="(s, i) in specs" :key="i" class="spec-row">
            <input v-model="s.key" class="input sm" placeholder="Battery" />
            <input v-model="s.value" class="input sm" placeholder="Up to 18 hours" />
            <button type="button" class="btn btn-ghost btn-sm" aria-label="Remove spec" @click="specs.splice(i, 1)">✕</button>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" @click="specs.push({ key: '', value: '' })">+ Add spec</button>

          <div v-if="formError" class="alert alert-error">{{ formError }}</div>
          <button class="btn btn-primary btn-lg btn-block" :disabled="saving">
            <span v-if="saving" class="spinner"></span> Save product
          </button>
        </form>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.head {
  margin-bottom: 20px;
}
.head h1 {
  margin: 0;
}
.search {
  padding: 8px 14px;
  font-size: 15px;
  border-radius: 980px;
}
.thumb {
  width: 64px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}
.swatch-row {
  gap: 6px;
  margin-top: 2px;
}
.actions {
  white-space: nowrap;
  text-align: right;
}
.overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgb(0 0 0 / 0.3);
  display: flex;
  justify-content: flex-end;
}
.panel {
  width: 100%;
  max-width: 620px;
  height: 100%;
  overflow-y: auto;
  background: #fff;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow);
}
.panel h2 {
  margin: 0;
}
.panel h4 {
  margin: 14px 0 0;
  font-size: 17px;
  padding-top: 14px;
  border-top: 1px solid var(--line-soft);
}
.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.input.sm {
  padding: 8px 10px;
  font-size: 15px;
}
.variants {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.variant {
  display: grid;
  grid-template-columns: 40px 1.3fr 1fr 1fr 0.8fr 36px;
  gap: 8px;
  align-items: center;
}
.variant.no-size,
.head-row:has(+ .no-size) {
  grid-template-columns: 40px 1.3fr 1fr 0.8fr 36px;
}
.color {
  width: 40px;
  height: 36px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 2px;
  background: #fff;
}
.spec-row {
  display: grid;
  grid-template-columns: 1fr 1.5fr 36px;
  gap: 8px;
}
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.25s;
}
.slide-enter-active .panel,
.slide-leave-active .panel {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
.slide-enter-from .panel,
.slide-leave-to .panel {
  transform: translateX(40px);
}
</style>
