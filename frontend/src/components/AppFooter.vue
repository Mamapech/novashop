<script setup>
const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container container-wide">
      <p class="note">
        Free delivery on every order across Thailand. Prices include VAT. Product images are illustrations.
        NovaShop is a portfolio project, so no real payments are taken.
      </p>
      <div class="cols">
        <div>
          <h4>Shop</h4>
          <RouterLink to="/products">All products</RouterLink>
          <RouterLink :to="{ name: 'products', query: { category: 'laptops' } }">Laptops</RouterLink>
          <RouterLink :to="{ name: 'products', query: { category: 'audio' } }">Audio</RouterLink>
          <RouterLink :to="{ name: 'products', query: { category: 'wearables' } }">Wearables</RouterLink>
        </div>
        <div>
          <h4>Account</h4>
          <RouterLink to="/account">Manage account</RouterLink>
          <RouterLink to="/orders">Order status</RouterLink>
          <RouterLink to="/cart">Cart</RouterLink>
        </div>
        <div>
          <h4>Help</h4>
          <RouterLink to="/compare">Compare products</RouterLink>
          <span>Free delivery</span>
          <span>Cancel before shipping</span>
        </div>
      </div>
      <div class="bottom">
        <span>Copyright © {{ year }} NovaShop. All rights reserved.</span>
        <span>Thailand</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--bg-alt);
  font-size: 12px;
  color: var(--muted);
  padding: 20px 0 24px;
  letter-spacing: -0.01em;
}
.note {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
  margin: 0;
}
.cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 20px 0;
}
.cols div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
h4 {
  font-size: 12px;
  color: var(--ink);
  margin: 0 0 2px;
  letter-spacing: -0.01em;
}
.cols a,
.cols span {
  color: var(--ink-2);
}
.bottom {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--line);
  padding-top: 16px;
}
@media (max-width: 734px) {
  .cols { grid-template-columns: 1fr 1fr; }
}
</style>
