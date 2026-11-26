<script setup>
import { ref, computed, onMounted } from "vue"
import { useRoute } from "vue-router"
import api, { errorMessage } from "@/api/client"
import { useAuthStore } from "@/stores/auth"
import { useToastStore } from "@/stores/toast"
import { money, dateTime } from "@/utils/format"
import StatusBadge from "@/components/StatusBadge.vue"
import ProductImage from "@/components/ProductImage.vue"

const route = useRoute()
const auth = useAuthStore()
const toast = useToastStore()

const order = ref(null)
const error = ref("")
const cancelling = ref(false)
const isNew = route.query.new === "1"

const STEPS = ["pending", "paid", "shipped", "delivered"]
const stepIndex = computed(() => STEPS.indexOf(order.value?.status))
const isOwner = computed(() => order.value?.customer.id === auth.member?.id)

onMounted(async () => {
  try {
    order.value = (await api.get(`/orders/${route.params.id}`)).data
  } catch (err) {
    error.value = errorMessage(err)
  }
})

async function cancel() {
  if (!confirm("Cancel this order? Items will go back in stock.")) return
  cancelling.value = true
  try {
    order.value = (await api.post(`/orders/${order.value.id}/cancel`)).data
    toast.success("Order cancelled")
  } catch (err) {
    toast.error(errorMessage(err))
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <div class="container">
    <div v-if="error" class="alert alert-error" style="margin-top: 32px">{{ error }}</div>
    <div v-else-if="!order" class="skeleton" style="height: 400px; margin-top: 32px"></div>

    <template v-else>
      <div v-if="isNew" class="success card">
        <div class="check">✓</div>
        <div>
          <strong>Thank you! Your order has been placed.</strong>
          <p class="muted small">We'll update the status here as it moves along.</p>
        </div>
      </div>

      <div class="page-header row-between">
        <div>
          <h1>Order #{{ order.id }}</h1>
          <p>Placed {{ dateTime(order.createdAt) }}</p>
        </div>
        <div class="row">
          <StatusBadge :status="order.status" />
          <button
            v-if="isOwner && order.status === 'pending'"
            class="btn btn-danger btn-sm"
            :disabled="cancelling"
            @click="cancel"
          >Cancel order</button>
        </div>
      </div>

      <div v-if="order.status !== 'cancelled'" class="card progress">
        <div v-for="(s, i) in STEPS" :key="s" class="step" :class="{ done: i <= stepIndex }">
          <span class="dot">{{ i < stepIndex ? "✓" : i + 1 }}</span>
          <span class="label">{{ s }}</span>
        </div>
      </div>

      <div class="layout">
        <div class="card">
          <div v-for="item in order.items" :key="item.productId + item.name" class="line">
            <div class="thumb"><ProductImage :product="{ id: item.productId || 0, name: item.name, imageUrl: item.imageUrl }" /></div>
            <div>
              <strong>{{ item.name }}</strong>
              <div class="muted small">{{ item.quantity }} × {{ money(item.unitPrice) }}</div>
            </div>
            <strong>{{ money(item.unitPrice * item.quantity) }}</strong>
          </div>
          <div class="line total">
            <span></span><span>Total</span><strong>{{ money(order.total) }}</strong>
          </div>
        </div>

        <aside class="card">
          <div class="card-body stack small">
            <h3>Delivery</h3>
            <div><strong>{{ order.shippingName }}</strong><br />{{ order.shippingPhone }}</div>
            <div class="address">{{ order.shippingAddress }}</div>
          </div>
        </aside>
      </div>

      <p style="margin-top: 24px">
        <RouterLink :to="auth.isAdmin && !isOwner ? '/admin/orders' : '/orders'">← Back to orders</RouterLink>
      </p>
    </template>
  </div>
</template>

<style scoped>
.success {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 32px;
  padding: 18px 20px;
  border-color: #a7f3d0;
  background: var(--success-soft);
}
.success p {
  margin: 2px 0 0;
}
.check {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--success);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
}
.progress {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 20px;
  margin-bottom: 24px;
}
.step {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  text-transform: capitalize;
}
.step .dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid var(--line);
  display: grid;
  place-items: center;
  font-size: 0.8rem;
  font-weight: 700;
  flex-shrink: 0;
}
.step.done {
  color: var(--ink);
  font-weight: 600;
}
.step.done .dot {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}
.layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}
.line {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
}
.thumb {
  border-radius: 6px;
  overflow: hidden;
}
.line.total {
  border-bottom: 0;
  font-size: 1.1rem;
}
.address {
  white-space: pre-line;
  color: var(--ink-2);
}
@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; }
  .progress { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
