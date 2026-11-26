import { Router } from "express"
import { requireAuth, requireAdmin } from "../middleware/auth.js"
import { uploadImage } from "../middleware/upload.js"
import * as auth from "../controllers/authController.js"
import * as products from "../controllers/productController.js"
import * as catalog from "../controllers/catalogController.js"
import * as orders from "../controllers/orderController.js"
import * as admin from "../controllers/adminController.js"

const router = Router()

// Auth & profile
router.post("/auth/register", auth.register)
router.post("/auth/login", auth.login)
router.get("/auth/me", requireAuth, auth.me)
router.patch("/auth/me", requireAuth, auth.updateMe)
router.post("/auth/me/avatar", requireAuth, uploadImage, auth.uploadAvatar)

// Catalog (public)
router.get("/products", products.listProducts)
router.get("/products/:id", products.getProduct)
router.get("/brands", catalog.listBrands)
router.get("/categories", catalog.listCategories)

// Product management (admin)
router.post("/products", requireAuth, requireAdmin, products.createProduct)
router.put("/products/:id", requireAuth, requireAdmin, products.updateProduct)
router.delete("/products/:id", requireAuth, requireAdmin, products.deleteProduct)
router.post("/products/:id/image", requireAuth, requireAdmin, uploadImage, products.uploadProductImage)

// Orders (logged-in customers)
router.post("/orders", requireAuth, orders.createOrder)
router.get("/orders", requireAuth, orders.listMyOrders)
router.get("/orders/:id", requireAuth, orders.getOrder)
router.post("/orders/:id/cancel", requireAuth, orders.cancelOrder)

// Admin dashboard
router.get("/admin/stats", requireAuth, requireAdmin, admin.getStats)
router.get("/admin/orders", requireAuth, requireAdmin, admin.listAllOrders)
router.patch("/admin/orders/:id/status", requireAuth, requireAdmin, admin.updateOrderStatus)

export default router
