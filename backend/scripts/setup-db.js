// Creates the tables, loads sample data and creates the admin account.
// Usage: npm run db:setup
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import bcrypt from "bcrypt"
import pool from "../src/config/db.js"

const dir = path.dirname(fileURLToPath(import.meta.url))
const read = (file) => fs.readFile(path.join(dir, "..", "db", file), "utf-8")

async function main() {
  console.log("Creating tables...")
  await pool.query(await read("schema.sql"))

  console.log("Loading sample data...")
  await pool.query(await read("seed.sql"))

  const email = process.env.ADMIN_EMAIL || "admin@novashop.test"
  const password = process.env.ADMIN_PASSWORD
  if (!password) throw new Error("Set ADMIN_PASSWORD in .env before running db:setup")

  const hash = await bcrypt.hash(password, 10)
  await pool.query(
    `INSERT INTO members (email, name, password_hash, role) VALUES ($1, 'Store Admin', $2, 'admin')`,
    [email, hash]
  )
  console.log(`Admin account created: ${email}`)
  console.log("Database is ready.")
}

main()
  .catch((err) => {
    console.error("Database setup failed:", err.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())
