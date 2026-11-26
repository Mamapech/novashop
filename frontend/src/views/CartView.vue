<script setup>
import { useCartStore } from "@/stores/cart"
import { useAuthStore } from "@/stores/auth"
import { money } from "@/utils/format"
import ProductImage from "@/components/ProductImage.vue"
import EmptyState from "@/components/EmptyState.vue"

const cart = useCartStore()
const auth = useAuthStore()
</script>

<template>
  <div class="container">
    <div class="page-header center">
      <h1 v-if="cart.items.length">Review your cart. <span class="muted">{{ money(cart.total) }}</span></h1>
      <h1 v-else>Your cart is empty.</h1>
      <p v-if="cart.items.length">Free delivery and free cancellation before shipping.</p>
    </div>

    <EmptyState v-if="!cart.items.length" title="Nothing here yet" text="Find something you love in the store.">
      <RouterLink to="/products" class="btn btn-primary">Continue shopping</RouterLink>
    </EmptyState>

    <template v-else>
      <div class="checkout-top">
        <RouterLink to="/checkout" class="btn btn-primary btn-lg">Check Out</RouterLink>
      </div>

      <div class="lines">
        <div v-for="item in cart.items" :key="item.variantId" class="line">
          <RouterLink :to="`/products/${item.productId}`" class="thumb">
            <ProductImage :src="item.imageUrl" :alt="item.name" ratio="1 / 1" />
          </RouterLink>
          <div class="line-main">
            <div class="line-top">
              <div>
                <RouterLink :to="`/products/${item.productId}`" class="name">{{ item.name }}</RouterLink>
                <div class="muted small">{{ item.variantLabel }}</div>
              </div>
              <div class="qty">
                <button aria-label="Less" :disabled="item.quantity <= 1" @click="cart.setQuantity(item.variantId, item.quantity - 1)">−</button>
                <span>{{ item.quantity }}</span>
                <button aria-label="More" :disabled="item.quantity >= Math.min(item.stock, 20)" @click="cart.setQuantity(item.variantId, item.quantity + 1)">+</button>
              </div>
              <div class="line-price">
                <strong>{{ money(item.price * item.quantity) }}</strong>
                <button class="link-btn" @click="cart.remove(item.variantId)">Remove</button>
              </div>
            </div>
            <p class="small muted delivery">Delivers in 2–3 business days · Free</p>
          </div>
        </div>
      </div>

      <div class="totals">
        <div class="row-between"><span>Subtotal</span><span>{{ money(cart.total) }}</span></div>
        <div class="row-between"><span>Shipping</span><span>FREE</span></div>
        <div class="row-between total"><span>Total</span><span>{{ money(cart.total) }}</span></div>
        <p class="small muted vat">Includes VAT of {{ money(cart.total * 7 / 107) }}</p>
        <RouterLink to="/checkout" class="btn btn-primary btn-lg btn-block">Check Out</RouterLink>
        <p v-if="!auth.isLoggedIn" class="small muted center">You'll be asked to sign in or create an account.</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.center {
  text-align: center;
}
.checkout-top {
  text-align: center;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--line-soft);
}
.line {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 32px;
  padding: 36px 0;
  border-bottom: 1px solid var(--line-soft);
}
.thumb {
  border-radius: 14px;
  overflow: hidden;
}
.line-top {
  display: grid;
  grid-template-columns: 1fr auto 140px;
  gap: 24px;
  align-items: start;
}
.name {
  color: var(--ink);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}
.line-price {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  font-size: 21px;
}
.link-btn {
  border: 0;
  background: none;
  color: var(--link);
  padding: 0;
  cursor: pointer;
  font: inherit;
  font-size: 15px;
}
.qty {
  display: flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 980px;
}
.qty button {
  width: 34px;
  height: 36px;
  border: 0;
  background: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--ink);
}
.qty button:disabled {
  color: var(--line);
  cursor: default;
}
.qty span {
  min-width: 20px;
  text-align: center;
}
.delivery {
  margin-top: 20px;
}
.totals {
  max-width: 420px;
  margin: 32px 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.total {
  font-size: 24px;
  font-weight: 600;
  padding-top: 16px;
  border-top: 1px solid var(--line-soft);
}
.vat {
  text-align: right;
  margin: -6px 0 8px;
}
@media (max-width: 734px) {
  .line { grid-template-columns: 90px 1fr; gap: 16px; }
  .line-top { grid-template-columns: 1fr; gap: 12px; }
  .line-price { align-items: flex-start; text-align: left; }
  .name { font-size: 19px; }
  .totals { max-width: none; }
}
</style>
