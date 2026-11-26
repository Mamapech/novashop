<script setup>
import { ref, onMounted } from "vue"
import api, { errorMessage } from "@/api/client"
import { money, date } from "@/utils/format"
import StatusBadge from "@/components/StatusBadge.vue"
import EmptyState from "@/components/EmptyState.vue"

const orders = ref([])
const loading = ref(true)
const error = ref("")

onMounted(async () => {
  try {
    orders.value = (await api.get("/orders")).data
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container">
    <div class="page-header">
      <h1>My orders</h1>
      <p>Track and manage your purchases.</p>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-else-if="loading" class="skeleton" style="height: 240px"></div>
    <EmptyState v-else-if="!orders.length" title="No orders yet" text="When you place an order it will show up here.">
      <RouterLink to="/products" class="btn btn-primary">Start shopping</RouterLink>
    </EmptyState>

    <div v-else class="card table-wrap">
      <table class="table">
        <thead>
          <tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th>Total</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id">
            <td><strong>#{{ o.id }}</strong></td>
            <td>{{ date(o.createdAt) }}</td>
            <td class="muted">{{ o.items.reduce((n, i) => n + i.quantity, 0) }} items</td>
            <td><StatusBadge :status="o.status" /></td>
            <td><strong>{{ money(o.total) }}</strong></td>
            <td><RouterLink :to="`/orders/${o.id}`" class="btn btn-outline btn-sm">View</RouterLink></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
