// Creates the tables, loads the sample catalog and creates the admin account.
// Usage: npm run db:setup   (this resets the database)
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import bcrypt from "bcrypt"
import pool from "../src/config/db.js"
import { brands, categories, products, imagePath } from "../db/seed-data.js"

const dir = path.dirname(fileURLToPath(import.meta.url))

// Stock numbers that look realistic but are the same on every run
function stockFor(i) {
  return [24, 12, 8, 40, 3, 16, 30, 5, 20, 60][i % 10]
}

async function main() {
  const client = await pool.connect()
  try {
    console.log("Creating tables...")
    await client.query(await fs.readFile(path.join(dir, "..", "db", "schema.sql"), "utf-8"))

    await client.query("BEGIN")
    console.log("Loading sample catalog...")

    const brandIds = {}
    for (const name of brands) {
      const { rows } = await client.query("INSERT INTO brands (name) VALUES ($1) RETURNING id", [name])
      brandIds[name] = rows[0].id
    }
    const categoryIds = {}
    for (const c of categories) {
      const { rows } = await client.query("INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id", [c.name, c.slug])
      categoryIds[c.slug] = rows[0].id
    }

    let variantCount = 0
    for (const p of products) {
      const { rows } = await client.query(
        `INSERT INTO products (sku, name, tagline, description, specs, size_option_name, price, image_url,
                               is_featured, brand_id, category_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [
          p.sku, p.name, p.tagline, p.description, JSON.stringify(p.specs), p.sizeOption || null,
          p.price, imagePath(p.sku, p.colors[0][0]), Boolean(p.featured), brandIds[p.brand], categoryIds[p.category],
        ]
      )
      const productId = rows[0].id

      const sizes = p.sizes || [[null, 0]]
      let order = 0
      for (const [colorName, colorHex] of p.colors) {
        for (const [sizeLabel, extra] of sizes) {
          const sku = [p.sku, colorName, sizeLabel].filter(Boolean).join("-").toUpperCase().replace(/\s+/g, "")
          const stock = p.soldOutColors?.includes(colorName) ? 0 : stockFor(variantCount)
          await client.query(
            `INSERT INTO product_variants (product_id, sku, color_name, color_hex, size_label, price, stock, image_url, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [productId, sku, colorName, colorHex, sizeLabel, p.price + extra, stock, imagePath(p.sku, colorName), order++]
          )
          variantCount++
        }
      }
    }

    const email = process.env.ADMIN_EMAIL || "admin@novashop.test"
    const password = process.env.ADMIN_PASSWORD
    if (!password) throw new Error("Set ADMIN_PASSWORD in .env before running db:setup")
    await client.query(
      `INSERT INTO members (email, name, password_hash, role) VALUES ($1, 'Store Admin', $2, 'admin')`,
      [email, await bcrypt.hash(password, 10)]
    )

    await client.query("COMMIT")
    console.log(`Loaded ${products.length} products with ${variantCount} variants.`)
    console.log(`Admin account: ${email}`)
    console.log("Database is ready.")
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

main()
  .catch((err) => {
    console.error("Database setup failed:", err.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())
