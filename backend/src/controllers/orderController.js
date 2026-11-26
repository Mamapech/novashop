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
                    'productId', oi.product_id, 'variantId', oi.variant_id, 'name', oi.name,
                    'variantLabel', oi.variant_label, 'unitPrice', oi.unit_price,
                    'quantity', oi.quantity, 'imageUrl', oi.image_url) ORDER BY oi.id)
           FROM order_items oi
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
// Body: { items: [{ variantId, quantity }], shippingName, shippingPhone, shippingAddress }
// Runs inside a transaction: either the whole order is saved and stock is reduced, or nothing changes.
export async function createOrder(req, res) {
  requireFields(req.body, ["shippingName", "shippingPhone", "shippingAddress"])
  const { items } = req.body
  if (!Array.isArray(items) || items.length === 0) throw badRequest("Your cart is empty")
  if (items.length > 50) throw badRequest("Too many different items in one order")

  // Merge duplicate lines (same variant twice) into one
  const wanted = new Map()
  for (const item of items) {
    const variantId = toPositiveInt(item.variantId, "variantId")
    const quantity = toPositiveInt(item.quantity, "quantity")
    if (quantity > 20) throw badRequest("You can buy at most 20 of each item")
    wanted.set(variantId, (wanted.get(variantId) || 0) + quantity)
  }

  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // FOR UPDATE locks these rows, so two customers can't buy the last item at the same time
    const { rows: variants } = await client.query(
      `SELECT v.id, v.product_id, v.price, v.stock, v.color_name, v.size_label,
              COALESCE(v.image_url, p.image_url) AS image_url, p.name
       FROM product_variants v JOIN products p ON p.id = v.product_id
       WHERE v.id = ANY($1::int[])
       FOR UPDATE OF v`,
      [[...wanted.keys()]]
    )
    if (variants.length !== wanted.size) throw badRequest("Some items in your cart are no longer available")

    let total = 0
    for (const v of variants) {
      const qty = wanted.get(v.id)
      const label = [v.color_name, v.size_label].filter(Boolean).join(", ")
      if (v.stock < qty) {
        throw conflict(v.stock === 0 ? `"${v.name}" (${label}) is sold out` : `Only ${v.stock} left of "${v.name}" (${label})`)
      }
      v.label = label
      total += v.price * qty
    }

    const { rows } = await client.query(
      `INSERT INTO orders (member_id, total, shipping_name, shipping_phone, shipping_address)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.user.id, total.toFixed(2), req.body.shippingName, req.body.shippingPhone, req.body.shippingAddress]
    )
    const orderId = rows[0].id

    for (const v of variants) {
      const qty = wanted.get(v.id)
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, name, variant_label, image_url, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, v.product_id, v.id, v.name, v.label, v.image_url, v.price, qty]
      )
      await client.query("UPDATE product_variants SET stock = stock - $1 WHERE id = $2", [qty, v.id])
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
      `UPDATE product_variants v SET stock = v.stock + oi.quantity
       FROM order_items oi WHERE oi.order_id = $1 AND oi.variant_id = v.id`,
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
