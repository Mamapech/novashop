<script setup>
import { ref, reactive, onMounted } from "vue"
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
const imageFile = ref(null)
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

function openForm(product = {}) {
  editing.value = product
  imageFile.value = null
  formError.value = ""
  Object.assign(form, {
    sku: product.sku || "",
    name: product.name || "",
    description: product.description || "",
    price: product.price ?? "",
    stock: product.stock ?? 0,
    isFeatured: product.isFeatured || false,
    brandId: product.brand?.id || "",
    categoryId: product.category?.id || "",
  })
}

async function save() {
  saving.value = true
  formError.value = ""
  try {
    const { data } = editing.value.id
      ? await api.put(`/products/${editing.value.id}`, form)
      : await api.post("/products", form)

    if (imageFile.value) {
      const body = new FormData()
      body.append("image", imageFile.value)
      await api.post(`/products/${data.id}/image`, body)
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
  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
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
        <form @submit.prevent="load"><input v-model="search" class="input" placeholder="Search..." /></form>
        <button class="btn btn-primary" @click="openForm()">+ New product</button>
      </div>
    </div>

    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="muted">Loading...</td></tr>
          <tr v-for="p in products" :key="p.id">
            <td>
              <div class="row">
                <div class="thumb"><ProductImage :product="p" /></div>
                <div>
                  <strong>{{ p.name }}</strong>
                  <div class="muted small">{{ p.brand?.name }} <span v-if="p.isFeatured" class="badge">Featured</span></div>
                </div>
              </div>
            </td>
            <td class="muted">{{ p.sku }}</td>
            <td>{{ p.category?.name }}</td>
            <td>{{ money(p.price) }}</td>
            <td>
              <span class="badge" :class="p.stock === 0 ? 'badge-danger' : p.stock <= 5 ? 'badge-warn' : 'badge-success'">
                {{ p.stock }}
              </span>
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
    <div v-if="editing" class="overlay" @click.self="editing = null">
      <form class="panel" @submit.prevent="save">
        <div class="row-between">
          <h2>{{ editing.id ? "Edit product" : "New product" }}</h2>
          <button type="button" class="btn btn-ghost btn-sm" @click="editing = null">Close</button>
        </div>
        <div class="grid two">
          <div class="field"><label>SKU</label><input v-model.trim="form.sku" class="input" required placeholder="ACC-010" /></div>
          <div class="field"><label>Price (฿)</label><input v-model.number="form.price" type="number" min="0" step="0.01" class="input" required /></div>
        </div>
        <div class="field"><label>Name</label><input v-model.trim="form.name" class="input" required /></div>
        <div class="field"><label>Description</label><textarea v-model="form.description" class="textarea"></textarea></div>
        <div class="grid two">
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
        <div class="grid two">
          <div class="field"><label>Stock</label><input v-model.number="form.stock" type="number" min="0" step="1" class="input" /></div>
          <div class="field">
            <label>Image</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" class="input" @change="imageFile = $event.target.files[0]" />
          </div>
        </div>
        <label class="checkbox"><input v-model="form.isFeatured" type="checkbox" /> Show on home page (featured)</label>
        <div v-if="formError" class="alert alert-error">{{ formError }}</div>
        <button class="btn btn-primary btn-lg btn-block" :disabled="saving">
          <span v-if="saving" class="spinner"></span> Save product
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.head {
  margin-bottom: 16px;
}
.head h1 {
  margin: 0;
}
.thumb {
  width: 48px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}
.actions {
  white-space: nowrap;
  text-align: right;
}
.overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgb(15 23 42 / 0.4);
  display: flex;
  justify-content: flex-end;
}
.panel {
  width: 100%;
  max-width: 480px;
  height: 100%;
  overflow-y: auto;
  background: #fff;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: var(--shadow);
}
.panel h2 {
  margin: 0;
}
.two {
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
