<template>
  <footer class="footer">
    <div class="container footer-inner">
      <div>
        <strong>NovaShop</strong>
        <p class="muted small">Gadgets and electronics, delivered free across Thailand.</p>
      </div>
      <nav class="links small">
        <RouterLink to="/products">Shop</RouterLink>
        <RouterLink to="/orders">Orders</RouterLink>
        <RouterLink to="/account">Account</RouterLink>
      </nav>
      <p class="muted small">© {{ new Date().getFullYear() }} NovaShop · Portfolio project</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--line);
  background: #fff;
  padding: 32px 0;
}
.footer-inner {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.footer p {
  margin: 4px 0 0;
}
.links {
  display: flex;
  gap: 20px;
}
.links a {
  color: var(--ink-2);
}
</style>
