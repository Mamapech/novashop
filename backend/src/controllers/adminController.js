import pool from "../config/db.js"
import { badRequest, notFound } from "../utils/httpError.js"
import { toPositiveInt } from "../utils/validate.js"
import { findOrder } from "./orderController.js"

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"]

// GET /api/admin/stats  (numbers for the dashboard)
export async function getStats(_req, res) {
  const [summary, byCategory, lowStock, recent] = await Promise.all([
    pool.query(`
      SELECT
        (SELECT COALESCE(sum(total), 0) FROM orders WHERE status <> 'cancelled') AS revenue,
        (SELECT count(*)::int FROM orders)                                    AS "orderCount",
        (SELECT count(*)::int FROM orders WHERE status = 'pending')           AS "pendingCount",
        (SELECT count(*)::int FROM members WHERE role = 'customer')           AS "customerCount",
        (SELECT count(*)::int FROM products)                                  AS "productCount"`),
    pool.query(`
      SELECT c.name AS category,
             COALESCE(sum(oi.unit_price * oi.quantity) FILTER (WHERE o.status <> 'cancelled'), 0) AS revenue
      FROM categories c
      LEFT JOIN products p     ON p.category_id = c.id
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o       ON o.id = oi.order_id
      GROUP BY c.name
      ORDER BY revenue DESC`),
    pool.query(`SELECT id, name, stock FROM products WHERE stock <= 5 ORDER BY stock, name LIMIT 10`),
    pool.query(`
      SELECT o.id, o.total, o.status, o.created_at AS "createdAt", m.name AS "customerName"
      FROM orders o JOIN members m ON m.id = o.member_id
      ORDER BY o.created_at DESC LIMIT 5`),
  ])

  res.json({
    ...summary.rows[0],
    salesByCategory: byCategory.rows,
    lowStock: lowStock.rows,
    recentOrders: recent.rows,
  })
}

// GET /api/admin/orders?status=
export async function listAllOrders(req, res) {
  const { status } = req.query
  if (status && !STATUSES.includes(status)) throw badRequest("Unknown order status")
  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.total, o.created_at AS "createdAt",
            m.name AS "customerName", m.email AS "customerEmail",
            (SELECT sum(quantity)::int FROM order_items WHERE order_id = o.id) AS "itemCount"
     FROM orders o JOIN members m ON m.id = o.member_id
     ${status ? "WHERE o.status = $1" : ""}
     ORDER BY o.created_at DESC`,
    status ? [status] : []
  )
  res.json(rows)
}

// PATCH /api/admin/orders/:id/status   Body: { status }
export async function updateOrderStatus(req, res) {
  const id = toPositiveInt(req.params.id, "Order id")
  const { status } = req.body
  if (!STATUSES.includes(status)) throw badRequest(`Status must be one of: ${STATUSES.join(", ")}`)

  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const { rows } = await client.query("SELECT status FROM orders WHERE id = $1 FOR UPDATE", [id])
    if (!rows[0]) throw notFound("Order not found")
    const oldStatus = rows[0].status
    if (oldStatus === "cancelled" && status !== "cancelled") {
      throw badRequest("A cancelled order cannot be reopened")
    }

    await client.query("UPDATE orders SET status = $1 WHERE id = $2", [status, id])
    // Cancelling puts the items back in stock
    if (status === "cancelled" && oldStatus !== "cancelled") {
      await client.query(
        `UPDATE products p SET stock = p.stock + oi.quantity
         FROM order_items oi WHERE oi.order_id = $1 AND oi.product_id = p.id`,
        [id]
      )
    }
    await client.query("COMMIT")
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
  res.json(await findOrder(id))
}
