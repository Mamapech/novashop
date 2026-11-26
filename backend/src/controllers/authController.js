import bcrypt from "bcrypt"
import pool from "../config/db.js"
import { signToken } from "../middleware/auth.js"
import { badRequest, conflict, unauthorized, notFound } from "../utils/httpError.js"
import { requireFields, isEmail } from "../utils/validate.js"

const MEMBER_FIELDS = `id, email, name, role, avatar_url AS "avatarUrl", created_at AS "createdAt"`

// POST /api/auth/register
export async function register(req, res) {
  requireFields(req.body, ["email", "name", "password"])
  const email = String(req.body.email).trim().toLowerCase()
  const name = String(req.body.name).trim()
  const password = String(req.body.password)

  if (!isEmail(email)) throw badRequest("Please enter a valid email address")
  if (password.length < 8) throw badRequest("Password must be at least 8 characters")

  const exists = await pool.query("SELECT 1 FROM members WHERE email = $1", [email])
  if (exists.rowCount) throw conflict("This email is already registered")

  const hash = await bcrypt.hash(password, 10)
  const { rows } = await pool.query(
    `INSERT INTO members (email, name, password_hash) VALUES ($1, $2, $3) RETURNING ${MEMBER_FIELDS}`,
    [email, name, hash]
  )
  const member = rows[0]
  res.status(201).json({ token: signToken(member), member })
}

// POST /api/auth/login
export async function login(req, res) {
  requireFields(req.body, ["email", "password"])
  const email = String(req.body.email).trim().toLowerCase()

  const { rows } = await pool.query(
    `SELECT ${MEMBER_FIELDS}, password_hash FROM members WHERE email = $1`,
    [email]
  )
  const found = rows[0]
  // Same message for a wrong email and a wrong password, so nobody can probe which emails exist
  if (!found || !(await bcrypt.compare(String(req.body.password), found.password_hash))) {
    throw unauthorized("Email or password is incorrect")
  }

  const { password_hash: _hash, ...member } = found
  res.json({ token: signToken(member), member })
}

// GET /api/auth/me
export async function me(req, res) {
  const { rows } = await pool.query(`SELECT ${MEMBER_FIELDS} FROM members WHERE id = $1`, [req.user.id])
  if (!rows[0]) throw notFound("Account not found")
  res.json(rows[0])
}

// PATCH /api/auth/me  (change display name)
export async function updateMe(req, res) {
  requireFields(req.body, ["name"])
  const { rows } = await pool.query(
    `UPDATE members SET name = $1 WHERE id = $2 RETURNING ${MEMBER_FIELDS}`,
    [String(req.body.name).trim(), req.user.id]
  )
  res.json(rows[0])
}

// POST /api/auth/me/avatar  (multipart form, field name "image")
export async function uploadAvatar(req, res) {
  if (!req.file) throw badRequest("Please choose an image file")
  const { rows } = await pool.query(
    `UPDATE members SET avatar_url = $1 WHERE id = $2 RETURNING ${MEMBER_FIELDS}`,
    [`/uploads/${req.file.filename}`, req.user.id]
  )
  res.json(rows[0])
}
