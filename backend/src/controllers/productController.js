import pool from "../config/db.js"
import { badRequest, notFound, conflict } from "../utils/httpError.js"
import { requireFields, toNonNegativeNumber, toPositiveInt } from "../utils/validate.js"

// Shared columns for lists and details. Brand, category and the color swatches come back as nested JSON.
const PRODUCT_COLUMNS = `
  p.id, p.sku, p.name, p.tagline, p.description, p.specs, p.price,
  p.size_option_name AS "sizeOptionName",
  p.image_url AS "imageUrl", p.is_featured AS "isFeatured", p.created_at AS "createdAt",
  CASE WHEN b.id IS NULL THEN NULL ELSE json_build_object('id', b.id, 'name', b.name) END AS brand,
  CASE WHEN c.id IS NULL THEN NULL ELSE json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) END AS category,
  COALESCE((SELECT sum(v.stock)::int FROM product_variants v WHERE v.product_id = p.id), 0) AS stock,
  COALESCE((
    SELECT json_agg(json_build_object('name', x.color_name, 'hex', x.color_hex, 'imageUrl', x.image_url) ORDER BY x.first_order)
    FROM (
      SELECT color_name, color_hex, min(image_url) AS image_url, min(sort_order) AS first_order
      FROM product_variants WHERE product_id = p.id AND color_name IS NOT NULL
      GROUP BY color_name, color_hex
    ) x
  ), '[]') AS colors`

const FROM_JOINS = `
  FROM products p
  LEFT JOIN brands b     ON b.id = p.brand_id
  LEFT JOIN categories c ON c.id = p.category_id`

const VARIANTS_COLUMN = `
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', v.id, 'sku', v.sku, 'colorName', v.color_name, 'colorHex', v.color_hex,
      'sizeLabel', v.size_label, 'price', v.price, 'stock', v.stock, 'imageUrl', v.image_url
    ) ORDER BY v.sort_order, v.id)
    FROM product_variants v WHERE v.product_id = p.id
  ), '[]') AS variants`

// Only these sort options are allowed, so user input never becomes raw SQL
const SORTS = {
  featured: "p.is_featured DESC, p.id",
  newest: "p.created_at DESC, p.id DESC",
  price_asc: "p.price ASC, p.id",
  price_desc: "p.price DESC, p.id",
  name: "p.name ASC",
}

export async function findProduct(id, client = pool) {
  const { rows } = await client.query(`SELECT ${PRODUCT_COLUMNS}, ${VARIANTS_COLUMN} ${FROM_JOINS} WHERE p.id = $1`, [id])
  if (!rows[0]) throw notFound("Product not found")
  return rows[0]
}

// GET /api/products?q=&category=&brand=&minPrice=&maxPrice=&inStock=&featured=&ids=&sort=&page=&limit=
export async function listProducts(req, res) {
  const { q, category, brand, minPrice, maxPrice, inStock, featured, ids } = req.query
  const sort = SORTS[req.query.sort] ? req.query.sort : "featured"
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
    where.push(`(p.name ILIKE ${p} OR p.description ILIKE ${p} OR p.tagline ILIKE ${p})`)
  }
  if (category) where.push(`c.slug = ${param(category)}`)
  if (brand) where.push(`b.id = ${param(Number(brand))}`)
  if (minPrice) where.push(`p.price >= ${param(Number(minPrice))}`)
  if (maxPrice) where.push(`p.price <= ${param(Number(maxPrice))}`)
  if (inStock === "true") where.push("EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.stock > 0)")
  if (featured === "true") where.push("p.is_featured")
  if (ids) {
    const list = String(ids).split(",").map(Number).filter(Number.isInteger).slice(0, 10)
    where.push(`p.id = ANY(${param(list)}::int[])`)
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : ""

  const countResult = await pool.query(`SELECT count(*)::int AS total ${FROM_JOINS} ${whereSql}`, params)
  const total = countResult.rows[0].total

  // The compare page needs full details (specs + variants) for the chosen products
  const extra = ids ? `, ${VARIANTS_COLUMN}` : ""
  const limitParam = param(limit)
  const offsetParam = param((page - 1) * limit)
  const { rows } = await pool.query(
    `SELECT ${PRODUCT_COLUMNS}${extra} ${FROM_JOINS} ${whereSql}
     ORDER BY ${SORTS[sort]} LIMIT ${limitParam} OFFSET ${offsetParam}`,
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

// ---------- Admin: create / update / delete ----------

function readProduct(body) {
  requireFields(body, ["sku", "name"])
  let specs = body.specs || {}
  if (typeof specs !== "object" || Array.isArray(specs)) throw badRequest("Specs must be an object, e.g. {\"Display\": \"14-inch\"}")
  return {
    sku: String(body.sku).trim().toUpperCase(),
    name: String(body.name).trim(),
    tagline: body.tagline ? String(body.tagline).trim() : "",
    description: body.description ? String(body.description) : "",
    specs,
    sizeOptionName: body.sizeOptionName ? String(body.sizeOptionName).trim() : null,
    isFeatured: Boolean(body.isFeatured),
    brandId: body.brandId ? Number(body.brandId) : null,
    categoryId: body.categoryId ? Number(body.categoryId) : null,
  }
}

function readVariants(body, productSku) {
  const list = body.variants
  if (!Array.isArray(list) || list.length === 0) throw badRequest("A product needs at least one variant (price and stock)")
  return list.map((v, i) => {
    const stock = v.stock === undefined || v.stock === "" ? 0 : Number(v.stock)
    if (!Number.isInteger(stock) || stock < 0) throw badRequest(`Variant ${i + 1}: stock must be a whole number of 0 or more`)
    const colorHex = v.colorHex ? String(v.colorHex).trim() : null
    if (colorHex && !/^#[0-9a-fA-F]{6}$/.test(colorHex)) throw badRequest(`Variant ${i + 1}: color must look like #1d1d1f`)
    const colorName = v.colorName ? String(v.colorName).trim() : null
    const sizeLabel = v.sizeLabel ? String(v.sizeLabel).trim() : null
    const sku = v.sku
      ? String(v.sku).trim().toUpperCase()
      : [productSku, colorName, sizeLabel].filter(Boolean).join("-").toUpperCase().replace(/\s+/g, "")
    return {
      id: v.id ? Number(v.id) : null,
      sku,
      colorName,
      colorHex,
      sizeLabel,
      price: toNonNegativeNumber(v.price, `Variant ${i + 1} price`),
      stock,
      imageUrl: v.imageUrl || null,
      sortOrder: i,
    }
  })
}

// Turn PostgreSQL constraint errors into friendly messages
function friendlyDbError(err) {
  if (err.code === "23505") {
    if (err.constraint?.includes("product_id_color_name")) throw conflict("Two variants have the same color and size")
    throw conflict("That SKU is already used by another product or variant")
  }
  if (err.code === "23503") throw badRequest("That brand or category does not exist")
  throw err
}

// Keep the product's "From" price and main image in sync with its variants
async function refreshSummary(client, productId) {
  await client.query(
    `UPDATE products p SET
       price = COALESCE((SELECT min(price) FROM product_variants WHERE product_id = p.id), 0),
       image_url = COALESCE(
         (SELECT image_url FROM product_variants WHERE product_id = p.id AND image_url IS NOT NULL ORDER BY sort_order LIMIT 1),
         p.image_url),
       updated_at = now()
     WHERE p.id = $1`,
    [productId]
  )
}

async function saveVariants(client, productId, variants) {
  // Remove variants that are no longer in the list (old orders keep their snapshot)
  const keepIds = variants.filter((v) => v.id).map((v) => v.id)
  await client.query("DELETE FROM product_variants WHERE product_id = $1 AND NOT (id = ANY($2::int[]))", [productId, keepIds])

  for (const v of variants) {
    const values = [v.sku, v.colorName, v.colorHex, v.sizeLabel, v.price, v.stock, v.imageUrl, v.sortOrder]
    if (v.id) {
      const r = await client.query(
        `UPDATE product_variants SET sku=$1, color_name=$2, color_hex=$3, size_label=$4, price=$5, stock=$6,
                image_url=COALESCE($7, image_url), sort_order=$8
         WHERE id=$9 AND product_id=$10`,
        [...values, v.id, productId]
      )
      if (!r.rowCount) throw badRequest(`Variant ${v.id} does not belong to this product`)
    } else {
      await client.query(
        `INSERT INTO product_variants (sku, color_name, color_hex, size_label, price, stock, image_url, sort_order, product_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [...values, productId]
      )
    }
  }
  await refreshSummary(client, productId)
}

async function inTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await fn(client)
    await client.query("COMMIT")
    return result
  } catch (err) {
    await client.query("ROLLBACK")
    friendlyDbError(err)
  } finally {
    client.release()
  }
}

// POST /api/products  (admin)
export async function createProduct(req, res) {
  const p = readProduct(req.body)
  const variants = readVariants(req.body, p.sku)
  const id = await inTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO products (sku, name, tagline, description, specs, size_option_name, is_featured, brand_id, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [p.sku, p.name, p.tagline, p.description, JSON.stringify(p.specs), p.sizeOptionName, p.isFeatured, p.brandId, p.categoryId]
    )
    await saveVariants(client, rows[0].id, variants)
    return rows[0].id
  })
  res.status(201).json(await findProduct(id))
}

// PUT /api/products/:id  (admin)
export async function updateProduct(req, res) {
  const id = toPositiveInt(req.params.id, "Product id")
  const p = readProduct(req.body)
  const variants = readVariants(req.body, p.sku)
  await inTransaction(async (client) => {
    const result = await client.query(
      `UPDATE products SET sku=$1, name=$2, tagline=$3, description=$4, specs=$5, size_option_name=$6,
              is_featured=$7, brand_id=$8, category_id=$9, updated_at=now()
       WHERE id=$10`,
      [p.sku, p.name, p.tagline, p.description, JSON.stringify(p.specs), p.sizeOptionName, p.isFeatured, p.brandId, p.categoryId, id]
    )
    if (!result.rowCount) throw notFound("Product not found")
    await saveVariants(client, id, variants)
  })
  res.json(await findProduct(id))
}

// DELETE /api/products/:id  (admin)
export async function deleteProduct(req, res) {
  const id = toPositiveInt(req.params.id, "Product id")
  const result = await pool.query("DELETE FROM products WHERE id = $1", [id])
  if (!result.rowCount) throw notFound("Product not found")
  res.status(204).end()
}

// POST /api/products/:id/image  (admin, multipart field "image")
// Optional form field "color": only variants of that color get the new picture.
// Without it, the picture becomes the product's main image and is used by every variant.
export async function uploadProductImage(req, res) {
  const id = toPositiveInt(req.params.id, "Product id")
  if (!req.file) throw badRequest("Please choose an image file")
  const url = `/uploads/${req.file.filename}`
  const color = req.body?.color

  await inTransaction(async (client) => {
    const exists = await client.query("SELECT 1 FROM products WHERE id = $1", [id])
    if (!exists.rowCount) throw notFound("Product not found")
    if (color) {
      await client.query("UPDATE product_variants SET image_url = $1 WHERE product_id = $2 AND color_name = $3", [url, id, color])
    } else {
      await client.query("UPDATE product_variants SET image_url = $1 WHERE product_id = $2", [url, id])
    }
    await refreshSummary(client, id)
  })
  res.json(await findProduct(id))
}
