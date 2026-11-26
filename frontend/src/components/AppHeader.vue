<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { useCartStore } from "@/stores/cart"
import { imageUrl } from "@/api/client"

const auth = useAuthStore()
const cart = useCartStore()
const router = useRouter()
const search = ref("")
const menuOpen = ref(false)

function submitSearch() {
  router.push({ name: "products", query: search.value ? { q: search.value } : {} })
  search.value = ""
}

function logout() {
  auth.logout()
  menuOpen.value = false
  router.push({ name: "home" })
}
</script>

<template>
  <header class="header">
    <div class="container header-inner">
      <RouterLink to="/" class="logo">
        <img src="/favicon.svg" alt="" width="30" height="30" />
        <span>NovaShop</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/products">Shop</RouterLink>
        <RouterLink v-if="auth.isLoggedIn" to="/orders">My orders</RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/admin">Admin</RouterLink>
      </nav>

      <form class="search" role="search" @submit.prevent="submitSearch">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input v-model="search" type="search" placeholder="Search products..." aria-label="Search products" />
      </form>

      <div class="actions">
        <RouterLink to="/cart" class="icon-btn" aria-label="Cart">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6 5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" />
          </svg>
          <span v-if="cart.count" class="cart-count">{{ cart.count }}</span>
        </RouterLink>

        <template v-if="auth.isLoggedIn">
          <div class="user">
            <button class="user-btn" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen">
              <img v-if="auth.member?.avatarUrl" :src="imageUrl(auth.member.avatarUrl)" alt="" class="avatar" />
              <span v-else class="avatar avatar-letter">{{ auth.member?.name?.[0]?.toUpperCase() }}</span>
            </button>
            <div v-if="menuOpen" class="menu card" @click="menuOpen = false">
              <div class="menu-head">
                <strong>{{ auth.member?.name }}</strong>
                <span class="muted small">{{ auth.member?.email }}</span>
              </div>
              <RouterLink to="/account">Account</RouterLink>
              <RouterLink to="/orders">My orders</RouterLink>
              <RouterLink v-if="auth.isAdmin" to="/admin">Admin dashboard</RouterLink>
              <button @click="logout">Log out</button>
            </div>
          </div>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-ghost btn-sm">Log in</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm hide-sm">Sign up</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgb(255 255 255 / 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
}
.header-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 68px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--ink);
  text-decoration: none;
}
.nav {
  display: flex;
  gap: 20px;
}
.nav a {
  color: var(--ink-2);
  font-weight: 500;
  text-decoration: none;
}
.nav a:hover,
.nav a.router-link-active {
  color: var(--brand);
}
.search {
  flex: 1;
  max-width: 420px;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
}
.search:focus-within {
  border-color: var(--brand);
}
.search input {
  border: 0;
  background: transparent;
  padding: 10px 0;
  font: inherit;
  width: 100%;
  outline: none;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: var(--ink-2);
}
.icon-btn:hover {
  background: var(--brand-soft);
  color: var(--brand);
}
.cart-count {
  position: absolute;
  top: 2px;
  right: 0;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--brand);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  display: grid;
  place-items: center;
}
.user {
  position: relative;
}
.user-btn {
  border: 0;
  background: none;
  padding: 0;
  cursor: pointer;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.avatar-letter {
  display: grid;
  place-items: center;
  background: var(--brand);
  color: #fff;
  font-weight: 600;
}
.menu {
  position: absolute;
  right: 0;
  top: 48px;
  width: 220px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
}
.menu-head {
  display: flex;
  flex-direction: column;
  padding: 8px 10px 10px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 6px;
  overflow: hidden;
}
.menu a,
.menu button {
  padding: 8px 10px;
  border-radius: 6px;
  color: var(--ink-2);
  text-align: left;
  font: inherit;
  background: none;
  border: 0;
  cursor: pointer;
  text-decoration: none;
}
.menu a:hover,
.menu button:hover {
  background: var(--bg);
}
@media (max-width: 860px) {
  .nav { display: none; }
  .header-inner { gap: 12px; }
}
@media (max-width: 560px) {
  .logo span, .hide-sm { display: none; }
}
</style>
