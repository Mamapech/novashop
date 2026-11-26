import pool from "../config/db.js"

// GET /api/brands
export async function listBrands(_req, res) {
  const { rows } = await pool.query("SELECT id, name FROM brands ORDER BY name")
  res.json(rows)
}

// GET /api/categories  (includes how many products each category has)
export async function listCategories(_req, res) {
  const { rows } = await pool.query(`
    SELECT c.id, c.name, c.slug, count(p.id)::int AS "productCount"
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name`)
  res.json(rows)
}
