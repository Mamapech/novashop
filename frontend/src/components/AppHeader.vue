<script setup>
import { ref, watch, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import { useCartStore } from "@/stores/cart"
import { useCompareStore } from "@/stores/compare"
import { imageUrl } from "@/api/client"

const auth = useAuthStore()
const cart = useCartStore()
const compare = useCompareStore()
const route = useRoute()
const router = useRouter()

const NAV = [
  { label: "Laptops", slug: "laptops" },
  { label: "Audio", slug: "audio" },
  { label: "Accessories", slug: "accessories" },
  { label: "Smart Home", slug: "smart-home" },
  { label: "Wearables", slug: "wearables" },
]

const searchOpen = ref(false)
const menuOpen = ref(false)
const mobileOpen = ref(false)
const search = ref("")
const searchInput = ref(null)

// Close every pop-up when the page changes
watch(
  () => route.fullPath,
  () => {
    searchOpen.value = false
    menuOpen.value = false
    mobileOpen.value = false
  }
)

async function openSearch() {
  searchOpen.value = !searchOpen.value
  menuOpen.value = false
  if (searchOpen.value) {
    await nextTick()
    searchInput.value?.focus()
  }
}

function submitSearch() {
  router.push({ name: "products", query: search.value ? { q: search.value } : {} })
  search.value = ""
}

function logout() {
  auth.logout()
  router.push({ name: "home" })
}

const isCategory = (slug) => route.name === "products" && route.query.category === slug
</script>

<template>
  <header class="header" :class="{ open: searchOpen || mobileOpen }">
    <nav class="container container-wide bar" aria-label="Main">
      <button class="icon-btn mobile-only" aria-label="Menu" @click="mobileOpen = !mobileOpen">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4">
          <path v-if="!mobileOpen" d="M2 6h14M2 12h14" /><path v-else d="M4 4l10 10M14 4L4 14" />
        </svg>
      </button>

      <RouterLink to="/" class="logo" aria-label="NovaShop home">
        <img src="/favicon.svg" alt="" width="22" height="22" />
        <span>NovaShop</span>
      </RouterLink>

      <ul class="links desktop-only">
        <li><RouterLink to="/products" :class="{ active: route.name === 'products' && !route.query.category }">Store</RouterLink></li>
        <li v-for="n in NAV" :key="n.slug">
          <RouterLink :to="{ name: 'products', query: { category: n.slug } }" :class="{ active: isCategory(n.slug) }">{{ n.label }}</RouterLink>
        </li>
        <li v-if="auth.isAdmin"><RouterLink to="/admin">Admin</RouterLink></li>
      </ul>

      <div class="actions">
        <button class="icon-btn" aria-label="Search" @click="openSearch">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4">
            <circle cx="7" cy="7" r="5.5" /><path d="m11 11 4 4" />
          </svg>
        </button>

        <RouterLink v-if="compare.ids.length" to="/compare" class="icon-btn" aria-label="Compare">
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4">
            <rect x="2" y="3" width="5.5" height="12" rx="1.5" /><rect x="10.5" y="3" width="5.5" height="12" rx="1.5" />
          </svg>
          <span class="dot-count">{{ compare.ids.length }}</span>
        </RouterLink>

        <RouterLink to="/cart" class="icon-btn" aria-label="Cart">
          <svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" stroke-width="1.4">
            <path d="M2 6h12l-1 11H3z" /><path d="M5 6V4.5a3 3 0 0 1 6 0V6" />
          </svg>
          <span v-if="cart.count" class="dot-count">{{ cart.count }}</span>
        </RouterLink>

        <div class="user">
          <button class="icon-btn" aria-label="Account" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen; searchOpen = false">
            <img v-if="auth.member?.avatarUrl" :src="imageUrl(auth.member.avatarUrl)" alt="" class="avatar" />
            <svg v-else width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4">
              <circle cx="9" cy="6" r="3.5" /><path d="M2.5 16.5c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
            </svg>
          </button>
          <Transition name="drop">
            <div v-if="menuOpen" class="menu">
              <template v-if="auth.isLoggedIn">
                <div class="menu-head">
                  <strong>{{ auth.member?.name }}</strong>
                  <span class="muted small">{{ auth.member?.email }}</span>
                </div>
                <RouterLink to="/orders">Orders</RouterLink>
                <RouterLink to="/account">Account</RouterLink>
                <RouterLink v-if="auth.isAdmin" to="/admin">Admin dashboard</RouterLink>
                <button @click="logout">Sign out</button>
              </template>
              <template v-else>
                <div class="menu-head"><strong>Welcome</strong><span class="muted small">Sign in to check out faster.</span></div>
                <RouterLink to="/login">Sign in</RouterLink>
                <RouterLink to="/register">Create account</RouterLink>
              </template>
            </div>
          </Transition>
        </div>
      </div>
    </nav>

    <!-- Search panel -->
    <Transition name="drop">
      <div v-if="searchOpen" class="panel">
        <form class="container search" role="search" @submit.prevent="submitSearch">
          <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3">
            <circle cx="7" cy="7" r="5.5" /><path d="m11 11 4 4" />
          </svg>
          <input ref="searchInput" v-model="search" type="search" placeholder="Search NovaShop" aria-label="Search products" />
        </form>
        <div class="container quick">
          <span class="muted small">Quick links</span>
          <RouterLink v-for="n in NAV" :key="n.slug" :to="{ name: 'products', query: { category: n.slug } }" class="chevron-link-before">{{ n.label }}</RouterLink>
        </div>
      </div>
    </Transition>

    <!-- Mobile menu -->
    <Transition name="drop">
      <div v-if="mobileOpen" class="panel mobile-only">
        <div class="container mobile-links">
          <RouterLink to="/products">Store</RouterLink>
          <RouterLink v-for="n in NAV" :key="n.slug" :to="{ name: 'products', query: { category: n.slug } }">{{ n.label }}</RouterLink>
          <RouterLink v-if="auth.isAdmin" to="/admin">Admin</RouterLink>
        </div>
      </div>
    </Transition>
  </header>
  <div v-if="searchOpen || mobileOpen || menuOpen" class="scrim" @click="searchOpen = mobileOpen = menuOpen = false"></div>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 60;
  background: rgb(251 251 253 / 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgb(0 0 0 / 0.08);
}
.header.open {
  background: rgb(251 251 253 / 0.97);
}
.bar {
  display: flex;
  align-items: center;
  height: 48px;
  gap: 8px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink);
  font-weight: 600;
  font-size: 16px;
  text-decoration: none !important;
  margin-right: auto;
}
.links {
  display: flex;
  gap: 4px;
  list-style: none;
  margin: 0 auto 0 0;
  padding: 0;
}
.links a {
  display: block;
  padding: 0 10px;
  font-size: 12.5px;
  color: var(--ink);
  opacity: 0.8;
  text-decoration: none;
  transition: opacity 0.2s;
}
.links a:hover,
.links a.active {
  opacity: 1;
}
.links a.active {
  font-weight: 600;
}
.actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
.icon-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 0;
  background: none;
  color: var(--ink);
  opacity: 0.85;
  cursor: pointer;
  border-radius: 50%;
}
.icon-btn:hover {
  opacity: 1;
}
.dot-count {
  position: absolute;
  bottom: 5px;
  right: 3px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  display: grid;
  place-items: center;
  letter-spacing: 0;
}
.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}
.user {
  position: relative;
}
.menu {
  position: absolute;
  right: 0;
  top: 46px;
  width: 260px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  border: 1px solid var(--line-soft);
}
.menu-head {
  display: flex;
  flex-direction: column;
  padding: 8px 10px 12px;
  border-bottom: 1px solid var(--line-soft);
  margin-bottom: 6px;
  overflow: hidden;
}
.menu a,
.menu button {
  padding: 9px 10px;
  border-radius: 8px;
  color: var(--ink);
  text-align: left;
  font: inherit;
  font-size: 15px;
  background: none;
  border: 0;
  cursor: pointer;
  text-decoration: none;
}
.menu a:hover,
.menu button:hover {
  background: var(--bg-alt);
}
.panel {
  border-top: 1px solid rgb(0 0 0 / 0.06);
  padding: 28px 0 40px;
}
.search {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--muted);
}
.search input {
  flex: 1;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 28px;
  font-weight: 600;
  color: var(--ink);
  outline: none;
  letter-spacing: -0.01em;
}
.quick {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
}
.quick a {
  color: var(--ink);
  font-size: 15px;
  font-weight: 600;
}
.mobile-links {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.mobile-links a {
  font-size: 24px;
  font-weight: 600;
  color: var(--ink);
}
.scrim {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgb(232 232 237 / 0.4);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.mobile-only {
  display: none;
}
@media (max-width: 833px) {
  .desktop-only { display: none; }
  .mobile-only { display: grid; }
  .panel.mobile-only { display: block; }
  .logo { margin: 0 auto; }
  .logo span { display: none; }
}
</style>
