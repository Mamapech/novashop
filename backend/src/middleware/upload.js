import multer from "multer"
import path from "node:path"
import crypto from "node:crypto"
import { badRequest } from "../utils/httpError.js"

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"])

const storage = multer.diskStorage({
  destination: "uploads",
  // Random file names so users can't overwrite each other's files
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg"
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`)
  },
})

export const uploadImage = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true)
    else cb(badRequest("Only JPG, PNG or WEBP images are allowed"))
  },
}).single("image")
