import pool from "../config/db.js"
import { badRequest, notFound, conflict } from "../utils/httpError.js"
import { requireFields, toNonNegativeNumber, toPositiveInt } from "../utils/validate.js"

// Every product comes back with its brand and category as nested JSON objects
const PRODUCT_SELECT = `
  SELECT p.id, p.sku, p.name, p.description, p.price, p.stock,
         p.image_url AS "imageUrl", p.is_featured AS "isFeatured", p.created_at AS "createdAt",
         CASE WHEN b.id IS NULL THEN NULL
              ELSE json_build_object('id', b.id, 'name', b.name) END AS brand,
         CASE WHEN c.id IS NULL THEN NULL
              ELSE json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) END AS category
  FROM products p
  LEFT JOIN brands b     ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id
`

// Only these sort options are allowed, so user input never becomes raw SQL
const SORTS = {
  newest: "p.created_at DESC, p.id DESC",
  price_asc: "p.price ASC, p.id",
  price_desc: "p.price DESC, p.id",
  name: "p.name ASC",
}

async function findProduct(id) {
  const { rows } = await pool.query(`${PRODUCT_SELECT} WHERE p.id = $1`, [id])
  if (!rows[0]) throw notFound("Product not found")
  return rows[0]
}

// GET /api/products?q=&category=&brand=&minPrice=&maxPrice=&inStock=&featured=&sort=&page=&limit=
export async function listProducts(req, res) {
  const { q, category, brand, minPrice, maxPrice, inStock, featured } = req.query
  const sort = SORTS[req.query.sort] ? req.query.sort : "newest"
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12))

  // Build the WHERE clause from whichever filters were sent.
  // Values always go in as $1, $2, ... parameters (this prevents SQL injection).
  const where = []
  const params = []
  const param = (value) => {
    params.push(value)
    return `$${params.length}`
  }

  if (q) {
    const p = param(`%${q}%`)
    where.push(`(p.name ILIKE ${p} OR p.description ILIKE ${p})`)
  }
  if (category) where.push(`c.slug = ${param(category)}`)
  if (brand) where.push(`b.id = ${param(Number(brand))}`)
  if (minPrice) where.push(`p.price >= ${param(Number(minPrice))}`)
  if (maxPrice) where.push(`p.price <= ${param(Number(maxPrice))}`)
  if (inStock === "true") where.push("p.stock > 0")
  if (featured === "true") where.push("p.is_featured")

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""

  const countResult = await pool.query(
    `SELECT count(*)::int AS total
     FROM products p
     LEFT JOIN brands b ON b.id = p.brand_id
     LEFT JOIN categories c ON c.id = p.category_id
     ${whereSql}`,
    params
  )
  const total = countResult.rows[0].total

  const limitParam = param(limit)
  const offsetParam = param((page - 1) * limit)
  const { rows } = await pool.query(
    `${PRODUCT_SELECT} ${whereSql} ORDER BY ${SORTS[sort]} LIMIT ${limitParam} OFFSET ${offsetParam}`,
    params
  )

  res.json({
    data: rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  })
}

// GET /api/products/:id
export async function getProduct(req, res) {
  res.json(await findProduct(toPositiveInt(req.params.id, "Product id")))
}

function readProductBody(body) {
  requireFields(body, ["sku", "name", "price"])
  const stock = body.stock === undefined || body.stock === "" ? 0 : Number(body.stock)
  if (!Number.isInteger(stock) || stock < 0) throw badRequest("Stock must be a whole number of 0 or more")
  return [
    String(body.sku).trim().toUpperCase(),
    String(body.name).trim(),
    body.description ? String(body.description) : "",
    toNonNegativeNumber(body.price, "Price"),
    stock,
    Boolean(body.isFeatured),
    body.brandId ? Number(body.brandId) : null,
    body.categoryId ? Number(body.categoryId) : null,
  ]
}

// Turn PostgreSQL constraint errors into friendly messages
function friendlyDbError(err) {
  if (err.code === "23505") throw conflict("A product with this SKU already exists")
  if (err.code === "23503") throw badRequest("That brand or category does not exist")
  throw err
}

// POST /api/products  (admin)
export async function createProduct(req, res) {
  const values = readProductBody(req.body)
  const { rows } = await pool
    .query(
      `INSERT INTO products (sku, name, description, price, stock, is_featured, brand_id, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      values
    )
    .catch(friendlyDbError)
  res.status(201).json(await findProduct(rows[0].id))
}

// PUT /api/products/:id  (admin)
export async function updateProduct(req, res) {
  const id = toPositiveInt(req.params.id, "Product id")
  const values = readProductBody(req.body)
  const result = await pool
    .query(
      `UPDATE products
       SET sku = $1, name = $2, description = $3, price = $4, stock = $5,
           is_featured = $6, brand_id = $7, category_id = $8, updated_at = now()
       WHERE id = $9`,
      [...values, id]
    )
    .catch(friendlyDbError)
  if (!result.rowCount) throw notFound("Product not found")
  res.json(await findProduct(id))
}

// DELETE /api/products/:id  (admin)
export async function deleteProduct(req, res) {
  const id = toPositiveInt(req.params.id, "Product id")
  const result = await pool.query("DELETE FROM products WHERE id = $1", [id])
  if (!result.rowCount) throw notFound("Product not found")
  res.status(204).end()
}

// POST /api/products/:id/image  (admin, multipart form, field name "image")
export async function uploadProductImage(req, res) {
  const id = toPositiveInt(req.params.id, "Product id")
  if (!req.file) throw badRequest("Please choose an image file")
  const result = await pool.query(
    "UPDATE products SET image_url = $1, updated_at = now() WHERE id = $2",
    [`/uploads/${req.file.filename}`, id]
  )
  if (!result.rowCount) throw notFound("Product not found")
  res.json(await findProduct(id))
}
