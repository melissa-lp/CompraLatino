import express from 'express'
import sql from './db.js'
import { OrderError } from './lib/errors.js'
import orderRoutes from './routes/orders.js'
import pricingRoutes from './routes/pricing.js'

// Variables sin las que el servicio no puede funcionar
for (const name of ['DATABASE_URL', 'CATALOG_URL', 'YAUCTIONS_API_URL', 'EXCHANGE_RATE_USD_PER_JPY', 'SERVICE_FEE_USD']) {
  if (!process.env[name]) {
    console.error(`Falta la variable de entorno ${name}`)
    process.exit(1)
  }
}
if (!(Number(process.env.EXCHANGE_RATE_USD_PER_JPY) > 0) || !(Number(process.env.SERVICE_FEE_USD) >= 0)) {
  console.error('EXCHANGE_RATE_USD_PER_JPY debe ser mayor que 0 y SERVICE_FEE_USD mayor o igual a 0 (usa punto decimal)')
  process.exit(1)
}

// Sin cors(): solo el gateway habla con orders
const app = express()
app.use(express.json({ limit: '100kb' }))

app.get('/health', async (req, res) => {
  try {
    await sql`select 1`
    res.json({ status: 'ok', service: 'orders', database: 'ok' })
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message)
    res.status(503).json({ status: 'error', service: 'orders', database: 'unreachable' })
  }
})

app.use(pricingRoutes)
app.use(orderRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

app.use((error, req, res, next) => {
  if (error instanceof OrderError) {
    return res.status(error.status).json({ error: error.message })
  }
  // JSON mal formado en el body
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' })
  }
  console.error('Error en orders:', error.message)
  res.status(500).json({ error: 'Ocurrió un error al procesar la orden' })
})

const port = process.env.PORT || 3003

app.listen(port, () => {
  console.log(`[Orders] Servicio corriendo en http://localhost:${port}`)
})
