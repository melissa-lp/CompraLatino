import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

if (!process.env.IDENTITY_URL) {
  console.error('Falta la variable de entorno IDENTITY_URL')
  process.exit(1)
}

const app = express()
// Estado del gateway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gateway' })
})

// Lo que empiece con /auth se reenvía a identity, con la ruta completa
app.use(createProxyMiddleware({
  target: process.env.IDENTITY_URL,
  pathFilter: '/auth'
}))

// Si ninguna ruta coincidió, el recurso no existe
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Gateway escuchando en http://localhost:${port}`)
})
