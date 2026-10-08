import express from 'express'
import cors from 'cors'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { requireAuth, requireRole } from './middleware/auth.js'

// Variables sin las que el gateway no puede funcionar
for (const name of ['JWT_SECRET', 'IDENTITY_URL', 'FRONTEND_URL']) {
  if (!process.env[name]) {
    console.error(`Falta la variable de entorno ${name}`)
    process.exit(1)
  }
}

const app = express()

// El navegador solo deja que el frontend (otro origen: puerto 5173) llame al gateway si este lo autoriza
app.use(cors({ origin: process.env.FRONTEND_URL }))

// Nadie de afuera puede enviar estos headers: solo el gateway los pone tras verificar el token
app.use((req, res, next) => {
  delete req.headers['x-user-id']
  delete req.headers['x-user-role']
  next()
})

// Estado del gateway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gateway' })
})

// Rutas que exigen sesión (se revisan antes de reenviar)
app.use('/orders', requireAuth)
app.use('/recommendations', requireAuth)
app.use('/admin', requireAuth, requireRole('admin'))

// Crea un proxy hacia un servicio
function proxyTo(target, pathFilter) {
  return createProxyMiddleware({
    target,
    pathFilter,
    on: {
      error: (err, req, res) => {
        console.error(`No se pudo contactar ${target}${req.url}:`, err.code ?? err.message)
        if (!res.headersSent) {
          res.status(503).json({ error: 'El servicio no está disponible, intenta más tarde' })
        }
      }
    }
  })
}

// Reenvío a cada servicio
app.use(proxyTo(process.env.IDENTITY_URL, '/auth'))

// Si ninguna ruta coincide, el recurso no existe
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Gateway escuchando en http://localhost:${port}`)
})
