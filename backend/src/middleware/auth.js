import jwt from "jsonwebtoken"
import { unauthorized, forbidden } from "../utils/httpError.js"

export function signToken(member) {
  return jwt.sign(
    { sub: member.id, role: member.role, name: member.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  )
}

// Reads "Authorization: Bearer <token>" and puts the member on req.user
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || ""
  const [scheme, token] = header.split(" ")
  if (scheme !== "Bearer" || !token) throw unauthorized()

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, role: payload.role, name: payload.name }
    next()
  } catch {
    throw unauthorized("Your session has expired, please log in again")
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== "admin") throw forbidden()
  next()
}
