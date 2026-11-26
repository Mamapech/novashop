<template>
  <div class="container admin">
    <aside class="side card">
      <span class="muted small label">Admin</span>
      <RouterLink :to="{ name: 'admin' }" exact-active-class="active">Dashboard</RouterLink>
      <RouterLink :to="{ name: 'admin-products' }" active-class="active">Products</RouterLink>
      <RouterLink :to="{ name: 'admin-orders' }" active-class="active">Orders</RouterLink>
    </aside>
    <section>
      <RouterView />
    </section>
  </div>
</template>

<style scoped>
.admin {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 28px;
  align-items: start;
  padding-top: 32px;
}
.side {
  position: sticky;
  top: 88px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.label {
  padding: 6px 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.side a {
  padding: 9px 12px;
  border-radius: 6px;
  color: var(--ink-2);
  font-weight: 500;
  text-decoration: none;
}
.side a:hover {
  background: var(--bg);
}
.side a.active {
  background: var(--brand-soft);
  color: var(--brand);
}
@media (max-width: 760px) {
  .admin { grid-template-columns: 1fr; }
  .side { position: static; flex-direction: row; flex-wrap: wrap; }
  .label { display: none; }
}
</style>
