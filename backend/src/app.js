import "dotenv/config"
import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import YAML from "yaml"
import swaggerUi from "swagger-ui-express"
import routes from "./routes/index.js"
import pool from "./config/db.js"
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is missing. Copy .env.example to .env and fill it in.")
}

const dir = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// Security headers; allow images to be loaded by the frontend on another port
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }))
app.use(express.json({ limit: "1mb" }))
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"))

// Uploaded images
app.use("/uploads", express.static(path.join(dir, "..", "uploads")))
// Pictures for the sample products
app.use("/images", express.static(path.join(dir, "..", "public", "images")))

// API documentation at /api-docs
const swaggerDoc = YAML.parse(fs.readFileSync(path.join(dir, "docs", "swagger.yaml"), "utf-8"))
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDoc))

// Health check: also confirms the database is reachable
app.get("/api/health", async (_req, res) => {
  await pool.query("SELECT 1")
  res.json({ status: "ok" })
})

app.use("/api", routes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
