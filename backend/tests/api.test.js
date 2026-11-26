// Integration tests: start the real app on a random port and call it with fetch.
// Run `npm run db:setup` first so the database has the sample data.
// Usage: npm test
import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import app from "../src/app.js"
import pool from "../src/config/db.js"

let server
let base

before(async () => {
  server = app.listen(0)
  base = `http://localhost:${server.address().port}/api`
})

after(async () => {
  server.close()
  await pool.end()
})

async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null }
}

const email = `test-${Date.now()}@example.com`
let token

test("health check reports ok", async () => {
  const res = await api("/health")
  assert.equal(res.status, 200)
  assert.equal(res.body.status, "ok")
})

test("lists products with pagination", async () => {
  const res = await api("/products?limit=5")
  assert.equal(res.status, 200)
  assert.equal(res.body.data.length, 5)
  assert.ok(res.body.pagination.total >= 5)
  assert.ok(res.body.data[0].brand.name)
  assert.ok(res.body.data[0].colors.length >= 1)
})

test("product detail includes variants and ordered specs", async () => {
  const res = await api("/products/1")
  assert.equal(res.status, 200)
  assert.equal(res.body.variants.length, 9) // 3 colors x 3 storage sizes
  assert.equal(res.body.price, Math.min(...res.body.variants.map((v) => v.price)))
  assert.equal(Object.keys(res.body.specs)[0], "Display")
})

test("filters by category and sorts by price", async () => {
  const res = await api("/products?category=laptops&sort=price_asc")
  const prices = res.body.data.map((p) => p.price)
  assert.ok(prices.length > 0)
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b))
  assert.ok(res.body.data.every((p) => p.category.slug === "laptops"))
})

test("search is safe from SQL injection", async () => {
  const res = await api(`/products?q=${encodeURIComponent("'; DROP TABLE products; --")}`)
  assert.equal(res.status, 200)
  assert.equal(res.body.data.length, 0)
})

test("registers and logs in a customer", async () => {
  const reg = await api("/auth/register", { method: "POST", body: { email, name: "Tester", password: "password123" } })
  assert.equal(reg.status, 201)
  assert.ok(reg.body.token)

  const dup = await api("/auth/register", { method: "POST", body: { email, name: "Tester", password: "password123" } })
  assert.equal(dup.status, 409)

  const bad = await api("/auth/login", { method: "POST", body: { email, password: "wrong-password" } })
  assert.equal(bad.status, 401)

  const login = await api("/auth/login", { method: "POST", body: { email, password: "password123" } })
  assert.equal(login.status, 200)
  token = login.body.token
})

test("customers cannot use admin endpoints", async () => {
  const res = await api("/admin/stats", { token })
  assert.equal(res.status, 403)
})

async function variantOf(productId, pick = (v) => v.stock > 2) {
  const product = (await api(`/products/${productId}`)).body
  return product.variants.find(pick)
}

const shipping = { shippingName: "Tester", shippingPhone: "0800000000", shippingAddress: "1 Test Road" }

test("placing an order reduces stock, cancelling restores it", async () => {
  const variant = await variantOf(4)

  const order = await api("/orders", {
    method: "POST",
    token,
    body: { items: [{ variantId: variant.id, quantity: 2 }], ...shipping },
  })
  assert.equal(order.status, 201)
  assert.equal(order.body.items.length, 1)
  assert.equal(order.body.items[0].variantLabel, variant.colorName)
  assert.equal(order.body.total, variant.price * 2)
  assert.equal((await variantOf(4, (v) => v.id === variant.id)).stock, variant.stock - 2)

  const cancel = await api(`/orders/${order.body.id}/cancel`, { method: "POST", token })
  assert.equal(cancel.body.status, "cancelled")
  assert.equal((await variantOf(4, (v) => v.id === variant.id)).stock, variant.stock)
})

test("cannot order a sold-out variant", async () => {
  const soldOut = await variantOf(14, (v) => v.stock === 0) // Northwind Ring in Gold is seeded sold out
  const res = await api("/orders", {
    method: "POST",
    token,
    body: { items: [{ variantId: soldOut.id, quantity: 1 }], ...shipping },
  })
  assert.equal(res.status, 409)
})

test("admin can create a product with variants", async () => {
  const login = await api("/auth/login", {
    method: "POST",
    body: { email: process.env.ADMIN_EMAIL || "admin@novashop.test", password: process.env.ADMIN_PASSWORD },
  })
  assert.equal(login.status, 200)
  const res = await api("/products", {
    method: "POST",
    token: login.body.token,
    body: {
      sku: `TST-${Date.now()}`,
      name: "Test Lamp",
      specs: { Power: "8 W" },
      sizeOptionName: "Size",
      variants: [
        { colorName: "White", colorHex: "#ffffff", sizeLabel: "S", price: 990, stock: 5 },
        { colorName: "White", colorHex: "#ffffff", sizeLabel: "L", price: 1290, stock: 0 },
      ],
    },
  })
  assert.equal(res.status, 201)
  assert.equal(res.body.price, 990)
  assert.equal(res.body.stock, 5)
  assert.equal(res.body.variants.length, 2)
  await api(`/products/${res.body.id}`, { method: "DELETE", token: login.body.token })
})
