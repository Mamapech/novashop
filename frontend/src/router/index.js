import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "@/stores/auth"
import HomeView from "@/views/HomeView.vue"

// Pages other than Home are lazy-loaded, so the first page load is small
const routes = [
  { path: "/", name: "home", component: HomeView },
  { path: "/products", name: "products", component: () => import("@/views/ProductsView.vue") },
  { path: "/products/:id", name: "product", component: () => import("@/views/ProductDetailView.vue") },
  { path: "/compare", name: "compare", component: () => import("@/views/CompareView.vue") },
  { path: "/cart", name: "cart", component: () => import("@/views/CartView.vue") },
  { path: "/login", name: "login", component: () => import("@/views/LoginView.vue"), meta: { guestOnly: true } },
  { path: "/register", name: "register", component: () => import("@/views/RegisterView.vue"), meta: { guestOnly: true } },

  // Logged-in customers
  { path: "/checkout", name: "checkout", component: () => import("@/views/CheckoutView.vue"), meta: { auth: true } },
  { path: "/orders", name: "orders", component: () => import("@/views/OrdersView.vue"), meta: { auth: true } },
  { path: "/orders/:id", name: "order", component: () => import("@/views/OrderDetailView.vue"), meta: { auth: true } },
  { path: "/account", name: "account", component: () => import("@/views/AccountView.vue"), meta: { auth: true } },

  // Admin back office
  {
    path: "/admin",
    component: () => import("@/views/admin/AdminLayout.vue"),
    meta: { auth: true, admin: true },
    children: [
      { path: "", name: "admin", component: () => import("@/views/admin/AdminDashboard.vue") },
      { path: "products", name: "admin-products", component: () => import("@/views/admin/AdminProducts.vue") },
      { path: "orders", name: "admin-orders", component: () => import("@/views/admin/AdminOrders.vue") },
    ],
  },

  { path: "/:pathMatch(.*)*", name: "not-found", component: () => import("@/views/NotFoundView.vue") },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved || { top: 0 },
})

// Route guards: send guests to login, and non-admins away from /admin
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.isLoggedIn) return { name: "login", query: { redirect: to.fullPath } }
  if (to.meta.admin && !auth.isAdmin) return { name: "home" }
  if (to.meta.guestOnly && auth.isLoggedIn) return { name: "home" }
})

export default router
