import { badRequest } from "./httpError.js"

// Small helpers to check request bodies without extra libraries.

export function requireFields(body, fields) {
  const missing = fields.filter((f) => body?.[f] === undefined || body?.[f] === null || String(body[f]).trim() === "")
  if (missing.length) throw badRequest(`Missing required fields: ${missing.join(", ")}`, { missing })
}

export function toPositiveInt(value, name) {
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0) throw badRequest(`${name} must be a positive whole number`)
  return n
}

export function toNonNegativeNumber(value, name) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) throw badRequest(`${name} must be a number of 0 or more`)
  return n
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function isEmail(value) {
  return EMAIL_RE.test(String(value))
}
