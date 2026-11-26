<script setup>
import { useCartStore } from "@/stores/cart"
import { money } from "@/utils/format"
import ProductImage from "@/components/ProductImage.vue"
import EmptyState from "@/components/EmptyState.vue"

const cart = useCartStore()
</script>

<template>
  <div class="container">
    <div class="page-header">
      <h1>Your cart</h1>
      <p>{{ cart.count }} item{{ cart.count === 1 ? "" : "s" }}</p>
    </div>

    <EmptyState v-if="!cart.items.length" title="Your cart is empty" text="Find something you like in the shop.">
      <RouterLink to="/products" class="btn btn-primary">Start shopping</RouterLink>
    </EmptyState>

    <div v-else class="layout">
      <div class="card">
        <div v-for="item in cart.items" :key="item.productId" class="line">
          <RouterLink :to="`/products/${item.productId}`" class="thumb">
            <ProductImage :product="{ id: item.productId, name: item.name, imageUrl: item.imageUrl }" />
          </RouterLink>
          <div class="line-info">
            <RouterLink :to="`/products/${item.productId}`" class="name">{{ item.name }}</RouterLink>
            <span class="muted small">{{ money(item.price) }} each</span>
            <button class="link-btn small" @click="cart.remove(item.productId)">Remove</button>
          </div>
          <div class="qty">
            <button aria-label="Less" @click="cart.setQuantity(item.productId, item.quantity - 1)">−</button>
            <span>{{ item.quantity }}</span>
            <button aria-label="More" @click="cart.setQuantity(item.productId, item.quantity + 1)">+</button>
          </div>
          <strong class="line-total">{{ money(item.price * item.quantity) }}</strong>
        </div>
      </div>

      <aside class="card summary">
        <div class="card-body stack">
          <h3>Order summary</h3>
          <div class="row-between"><span class="muted">Subtotal</span><span>{{ money(cart.total) }}</span></div>
          <div class="row-between"><span class="muted">Delivery</span><span class="free">Free</span></div>
          <div class="row-between total"><span>Total</span><span>{{ money(cart.total) }}</span></div>
          <RouterLink to="/checkout" class="btn btn-primary btn-lg btn-block">Checkout</RouterLink>
          <RouterLink to="/products" class="btn btn-ghost btn-block">Continue shopping</RouterLink>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 28px;
  align-items: start;
}
.line {
  display: grid;
  grid-template-columns: 88px 1fr auto 110px;
  gap: 16px;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}
.line:last-child {
  border-bottom: 0;
}
.thumb {
  border-radius: var(--radius-sm);
  overflow: hidden;
}
.line-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.name {
  color: var(--ink);
  font-weight: 600;
}
.link-btn {
  border: 0;
  background: none;
  color: var(--danger);
  padding: 4px 0 0;
  cursor: pointer;
  font: inherit;
}
.qty {
  display: flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
}
.qty button {
  width: 34px;
  height: 36px;
  border: 0;
  background: none;
  cursor: pointer;
  font-size: 1.1rem;
}
.qty span {
  min-width: 24px;
  text-align: center;
}
.line-total {
  text-align: right;
}
.summary {
  position: sticky;
  top: 88px;
}
.free {
  color: var(--success);
  font-weight: 600;
}
.total {
  font-weight: 700;
  font-size: 1.15rem;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
@media (max-width: 860px) {
  .layout { grid-template-columns: 1fr; }
  .summary { position: static; }
}
@media (max-width: 560px) {
  .line { grid-template-columns: 64px 1fr; }
  .qty, .line-total { grid-column: 2; justify-self: start; }
}
</style>
