import pool from "../config/db.js"
import { badRequest, notFound, forbidden, conflict } from "../utils/httpError.js"
import { requireFields, toPositiveInt } from "../utils/validate.js"

const ORDER_SELECT = `
  SELECT o.id, o.status, o.total, o.created_at AS "createdAt",
         o.shipping_name AS "shippingName", o.shipping_phone AS "shippingPhone",
         o.shipping_address AS "shippingAddress",
         json_build_object('id', m.id, 'name', m.name, 'email', m.email) AS customer,
         COALESCE((
           SELECT json_agg(json_build_object(
                    'productId', oi.product_id, 'name', oi.name,
                    'unitPrice', oi.unit_price, 'quantity', oi.quantity,
                    'imageUrl', p.image_url) ORDER BY oi.id)
           FROM order_items oi
           LEFT JOIN products p ON p.id = oi.product_id
           WHERE oi.order_id = o.id
         ), '[]') AS items
  FROM orders o
  JOIN members m ON m.id = o.member_id
`

export async function findOrder(id) {
  const { rows } = await pool.query(`${ORDER_SELECT} WHERE o.id = $1`, [id])
  if (!rows[0]) throw notFound("Order not found")
  return rows[0]
}

// POST /api/orders
// Body: { items: [{ productId, quantity }], shippingName, shippingPhone, shippingAddress }
// Runs inside a transaction: either the whole order is saved and stock is reduced, or nothing changes.
export async function createOrder(req, res) {
  requireFields(req.body, ["shippingName", "shippingPhone", "shippingAddress"])
  const { items } = req.body
  if (!Array.isArray(items) || items.length === 0) throw badRequest("Your cart is empty")

  // Merge duplicate lines (same product twice) into one
  const wanted = new Map()
  for (const item of items) {
    const productId = toPositiveInt(item.productId, "productId")
    const quantity = toPositiveInt(item.quantity, "quantity")
    wanted.set(productId, (wanted.get(productId) || 0) + quantity)
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // FOR UPDATE locks these rows, so two customers can't buy the last item at the same time
    const { rows: products } = await client.query(
      "SELECT id, name, price, stock FROM products WHERE id = ANY($1::int[]) FOR UPDATE",
      [[...wanted.keys()]]
    )

    if (products.length !== wanted.size) throw badRequest("Some products in your cart no longer exist")

    let total = 0
    for (const p of products) {
      const qty = wanted.get(p.id)
      if (p.stock < qty) throw conflict(`Only ${p.stock} left of "${p.name}"`)
      total += p.price * qty
    }

    const { rows } = await client.query(
      `INSERT INTO orders (member_id, total, shipping_name, shipping_phone, shipping_address)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.user.id, total.toFixed(2), req.body.shippingName, req.body.shippingPhone, req.body.shippingAddress]
    )
    const orderId = rows[0].id

    for (const p of products) {
      const qty = wanted.get(p.id)
      await client.query(
        "INSERT INTO order_items (order_id, product_id, name, unit_price, quantity) VALUES ($1, $2, $3, $4, $5)",
        [orderId, p.id, p.name, p.price, qty]
      )
      await client.query("UPDATE products SET stock = stock - $1 WHERE id = $2", [qty, p.id])
    }

    await client.query("COMMIT")
    res.status(201).json(await findOrder(orderId))
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

// GET /api/orders  (the logged-in member's orders, newest first)
export async function listMyOrders(req, res) {
  const { rows } = await pool.query(`${ORDER_SELECT} WHERE o.member_id = $1 ORDER BY o.created_at DESC`, [req.user.id])
  res.json(rows)
}

// GET /api/orders/:id  (owner or admin)
export async function getOrder(req, res) {
  const order = await findOrder(toPositiveInt(req.params.id, "Order id"))
  if (order.customer.id !== req.user.id && req.user.role !== "admin") throw forbidden()
  res.json(order)
}

// POST /api/orders/:id/cancel  (owner, only while the order is still pending)
export async function cancelOrder(req, res) {
  const id = toPositiveInt(req.params.id, "Order id")
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const { rows } = await client.query("SELECT member_id, status FROM orders WHERE id = $1 FOR UPDATE", [id])
    const order = rows[0]
    if (!order) throw notFound("Order not found")
    if (order.member_id !== req.user.id) throw forbidden()
    if (order.status !== "pending") throw conflict("Only pending orders can be cancelled")

    await client.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [id])
    // Put the items back in stock
    await client.query(
      `UPDATE products p SET stock = p.stock + oi.quantity
       FROM order_items oi WHERE oi.order_id = $1 AND oi.product_id = p.id`,
      [id]
    )
    await client.query("COMMIT")
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
  res.json(await findOrder(id))
}
