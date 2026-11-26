<script setup>
import { reactive, ref } from "vue"
import { useRouter } from "vue-router"
import api, { errorMessage } from "@/api/client"
import { useCartStore } from "@/stores/cart"
import { useAuthStore } from "@/stores/auth"
import { useToastStore } from "@/stores/toast"
import { money } from "@/utils/format"
import EmptyState from "@/components/EmptyState.vue"
import AddressPicker from "@/components/AddressPicker.vue"

const cart = useCartStore()
const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const form = reactive({
  shippingName: auth.member?.name || "",
  shippingPhone: "",
  shippingAddress: "",
})
const submitting = ref(false)

// Filled in automatically when the customer picks a spot on the map
function onPickedAddress({ address }) {
  form.shippingAddress = address
}
const error = ref("")

async function placeOrder() {
  error.value = ""
  if (!/^0\d{8,9}$/.test(form.shippingPhone.replace(/[\s-]/g, ""))) {
    error.value = "Please enter a valid Thai phone number, e.g. 081-234-5678"
    return
  }
  submitting.value = true
  try {
    const { data } = await api.post("/orders", {
      ...form,
      items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    })
    // Go to the order page first, then empty the cart (so this page never flashes "empty")
    await router.push({ name: "order", params: { id: data.id }, query: { new: "1" } })
    cart.clear()
    toast.success("Order placed. Thank you!")
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="container">
    <div class="page-header">
      <h1>Checkout</h1>
      <p>Where should we deliver your order?</p>
    </div>

    <EmptyState v-if="!cart.items.length" title="Nothing to check out" text="Your cart is empty.">
      <RouterLink to="/products" class="btn btn-primary">Go shopping</RouterLink>
    </EmptyState>

    <div v-else class="layout">
      <form class="card" @submit.prevent="placeOrder">
        <div class="card-body stack">
          <h3>Delivery details</h3>
          <div class="field">
            <label for="name">Full name</label>
            <input id="name" v-model.trim="form.shippingName" class="input" required autocomplete="name" />
          </div>
          <div class="field">
            <label for="phone">Phone</label>
            <input id="phone" v-model.trim="form.shippingPhone" class="input" required placeholder="081-234-5678" autocomplete="tel" />
          </div>
          <div class="field">
            <label>Delivery location</label>
            <AddressPicker @address="onPickedAddress" />
          </div>
          <div class="field">
            <label for="address">Address</label>
            <textarea id="address" v-model.trim="form.shippingAddress" class="textarea" required
              placeholder="House number, street, district, province, postal code" autocomplete="street-address"></textarea>
          </div>
          <div class="note small">
            <strong>Payment:</strong> this is a demo shop, so no real payment is taken. Your order starts as
            <em>pending</em> and the store admin updates it to paid and shipped.
          </div>
          <div v-if="error" class="alert alert-error">{{ error }}</div>
          <button class="btn btn-primary btn-lg btn-block" :disabled="submitting">
            <span v-if="submitting" class="spinner"></span>
            Place order · {{ money(cart.total) }}
          </button>
        </div>
      </form>

      <aside class="card">
        <div class="card-body stack">
          <h3>Your order</h3>
          <div v-for="item in cart.items" :key="item.productId" class="row-between small">
            <span>{{ item.quantity }} × {{ item.name }}</span>
            <span>{{ money(item.price * item.quantity) }}</span>
          </div>
          <div class="row-between small"><span class="muted">Delivery</span><span>Free</span></div>
          <div class="row-between total"><span>Total</span><span>{{ money(cart.total) }}</span></div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 28px;
  align-items: start;
}
.note {
  background: var(--info-soft);
  color: var(--ink-2);
  padding: 12px 14px;
  border-radius: var(--radius-sm);
}
.total {
  font-weight: 700;
  font-size: 1.1rem;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}
@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
}
</style>
