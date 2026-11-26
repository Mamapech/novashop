import multer from "multer"

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.code === "LIMIT_FILE_SIZE" ? "Image must be 2 MB or smaller" : err.message })
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body is not valid JSON" })
  }

  const status = err.status || 500
  if (status >= 500) console.error(err)
  res.status(status).json({
    message: status >= 500 ? "Something went wrong on the server" : err.message,
    ...(err.details && { details: err.details }),
  })
}
