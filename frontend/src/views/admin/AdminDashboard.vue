<script setup>
import { ref, computed, onMounted } from "vue"
import api, { errorMessage } from "@/api/client"
import { money, date } from "@/utils/format"
import StatusBadge from "@/components/StatusBadge.vue"

const stats = ref(null)
const error = ref("")

onMounted(async () => {
  try {
    stats.value = (await api.get("/admin/stats")).data
  } catch (err) {
    error.value = errorMessage(err)
  }
})

// Width of each bar in the "sales by category" chart
const maxCategory = computed(() => Math.max(1, ...(stats.value?.salesByCategory.map((c) => c.revenue) || [])))
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-else-if="!stats" class="skeleton" style="height: 400px"></div>

    <template v-else>
      <div class="kpis">
        <div class="kpi card"><span class="muted small">Revenue</span><strong>{{ money(stats.revenue) }}</strong></div>
        <div class="kpi card"><span class="muted small">Orders</span><strong>{{ stats.orderCount }}</strong></div>
        <div class="kpi card"><span class="muted small">Pending</span><strong>{{ stats.pendingCount }}</strong></div>
        <div class="kpi card"><span class="muted small">Customers</span><strong>{{ stats.customerCount }}</strong></div>
      </div>

      <div class="two">
        <div class="card">
          <div class="card-body">
            <h3>Sales by category</h3>
            <div v-for="c in stats.salesByCategory" :key="c.category" class="bar-row">
              <span class="small">{{ c.category }}</span>
              <div class="bar"><div :style="{ width: `${(c.revenue / maxCategory) * 100}%` }"></div></div>
              <span class="small amount">{{ money(c.revenue) }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <h3>Low stock</h3>
            <p v-if="!stats.lowStock.length" class="muted small">Everything is well stocked.</p>
            <div v-for="p in stats.lowStock" :key="p.id" class="row-between low">
              <span class="small">{{ p.name }}</span>
              <span class="badge" :class="p.stock === 0 ? 'badge-danger' : 'badge-warn'">{{ p.stock }} left</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card table-wrap">
        <div class="card-body row-between" style="padding-bottom: 8px">
          <h3 style="margin: 0">Recent orders</h3>
          <RouterLink :to="{ name: 'admin-orders' }">View all →</RouterLink>
        </div>
        <table class="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>
            <tr v-for="o in stats.recentOrders" :key="o.id">
              <td><RouterLink :to="`/orders/${o.id}`">#{{ o.id }}</RouterLink></td>
              <td>{{ o.customerName }}</td>
              <td>{{ date(o.createdAt) }}</td>
              <td><StatusBadge :status="o.status" /></td>
              <td>{{ money(o.total) }}</td>
            </tr>
            <tr v-if="!stats.recentOrders.length"><td colspan="5" class="muted">No orders yet.</td></tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.kpi {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kpi strong {
  font-size: 1.6rem;
}
.two {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.bar-row {
  display: grid;
  grid-template-columns: 110px 1fr 90px;
  gap: 12px;
  align-items: center;
  margin-top: 12px;
}
.bar {
  height: 10px;
  background: var(--bg);
  border-radius: 999px;
  overflow: hidden;
}
.bar div {
  height: 100%;
  background: var(--brand);
  border-radius: 999px;
  min-width: 2px;
}
.amount {
  text-align: right;
}
.low {
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
}
.low:last-child {
  border-bottom: 0;
}
@media (max-width: 900px) {
  .two { grid-template-columns: 1fr; }
}
</style>
