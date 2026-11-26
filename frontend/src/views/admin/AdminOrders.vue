<script setup>
import { ref, onMounted } from "vue"
import api, { errorMessage } from "@/api/client"
import { useToastStore } from "@/stores/toast"
import { money, dateTime } from "@/utils/format"

const toast = useToastStore()
const orders = ref([])
const status = ref("")
const loading = ref(true)

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"]

async function load() {
  loading.value = true
  try {
    orders.value = (await api.get("/admin/orders", { params: { status: status.value || undefined } })).data
  } catch (err) {
    toast.error(errorMessage(err))
  } finally {
    loading.value = false
  }
}
onMounted(load)

async function changeStatus(order, newStatus) {
  if (newStatus === "cancelled" && !confirm(`Cancel order #${order.id}? Items go back in stock.`)) {
    return load() // reset the dropdown
  }
  try {
    await api.patch(`/admin/orders/${order.id}/status`, { status: newStatus })
    order.status = newStatus
    toast.success(`Order #${order.id} is now ${newStatus}`)
  } catch (err) {
    toast.error(errorMessage(err))
    load()
  }
}
</script>

<template>
  <div>
    <div class="row-between head">
      <h1>Orders</h1>
      <div class="tabs">
        <button :class="{ active: !status }" @click="status = ''; load()">All</button>
        <button v-for="s in STATUSES" :key="s" :class="{ active: status === s }" @click="status = s; load()">{{ s }}</button>
      </div>
    </div>

    <div class="card table-wrap">
      <table class="table">
        <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="6" class="muted">Loading...</td></tr>
          <tr v-else-if="!orders.length"><td colspan="6" class="muted">No orders found.</td></tr>
          <tr v-for="o in orders" :key="o.id">
            <td><RouterLink :to="`/orders/${o.id}`"><strong>#{{ o.id }}</strong></RouterLink></td>
            <td>{{ o.customerName }}<div class="muted small">{{ o.customerEmail }}</div></td>
            <td class="small">{{ dateTime(o.createdAt) }}</td>
            <td>{{ o.itemCount }}</td>
            <td><strong>{{ money(o.total) }}</strong></td>
            <td>
              <select
                class="select status"
                :value="o.status"
                :disabled="o.status === 'cancelled'"
                @change="changeStatus(o, $event.target.value)"
              >
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
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
.tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.tabs button {
  border: 1px solid var(--line);
  background: #fff;
  padding: 6px 12px;
  border-radius: 999px;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  text-transform: capitalize;
}
.tabs button.active {
  background: var(--ink);
  color: #fff;
  border-color: var(--ink);
}
.status {
  width: 130px;
  padding: 6px 8px;
  text-transform: capitalize;
}
</style>
