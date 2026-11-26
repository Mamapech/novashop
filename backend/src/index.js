import app from "./app.js"

const port = Number(process.env.PORT) || 3000

app.listen(port, () => {
  console.log(`NovaShop API running at http://localhost:${port}`)
  console.log(`API docs:            http://localhost:${port}/api-docs`)
})
