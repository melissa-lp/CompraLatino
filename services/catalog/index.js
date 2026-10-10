import express from 'express'
import pool from './db.js'
import adminRoutes from './routes/admin.js'
import categoryRoutes from './routes/categories.js'
import internalRoutes from './routes/internal.js'
import productRoutes from './routes/products.js'

for (const name of ['DATABASE_URL', 'YAUCTIONS_API_URL']) {
  if (!process.env[name]) {
    console.error(`Falta la variable de entorno ${name}`)
    process.exit(1)
  }
}

const app = express()

app.get('/health', async (req, res) => {
  try {
    await pool.query('select 1')
    res.json({ status: 'ok', service: 'catalog', database: 'ok' })
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message)
    res.status(503).json({ status: 'error', service: 'catalog', database: 'unreachable' })
  }
})

app.use(productRoutes)
app.use(categoryRoutes)
app.use(adminRoutes)
app.use(internalRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// Errores inesperados
app.use((error, req, res, next) => {
  console.error('Error en catalog:', error.message)
  res.status(500).json({ error: 'Ocurrió un error en el catálogo' })
})

const port = process.env.PORT || 3002

app.listen(port, () => {
  console.log(`[Catálogo] Servicio corriendo en http://localhost:${port}`)
})
