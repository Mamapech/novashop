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

test("placing an order reduces stock, cancelling restores it", async () => {
  const before = (await api("/products/4")).body.stock

  const order = await api("/orders", {
    method: "POST",
    token,
    body: {
      items: [{ productId: 4, quantity: 2 }],
      shippingName: "Tester",
      shippingPhone: "0800000000",
      shippingAddress: "1 Test Road",
    },
  })
  assert.equal(order.status, 201)
  assert.equal(order.body.items.length, 1)
  assert.equal(order.body.total, order.body.items[0].unitPrice * 2)
  assert.equal((await api("/products/4")).body.stock, before - 2)

  const cancel = await api(`/orders/${order.body.id}/cancel`, { method: "POST", token })
  assert.equal(cancel.body.status, "cancelled")
  assert.equal((await api("/products/4")).body.stock, before)
})

test("cannot order more than is in stock", async () => {
  const res = await api("/orders", {
    method: "POST",
    token,
    body: {
      items: [{ productId: 14, quantity: 1 }], // seeded with 0 stock
      shippingName: "Tester",
      shippingPhone: "0800000000",
      shippingAddress: "1 Test Road",
    },
  })
  assert.equal(res.status, 409)
})
