import express from 'express'
import sql from './db.js'
import authRoutes from './routes/auth.js'

const app = express()

// Permite leer el cuerpo de las peticiones en formato JSON (registro y login)
app.use(express.json())
app.use('/auth', authRoutes)

app.get('/health', async (req, res) => {
  try {
    await sql`select 1`
    res.json({ status: 'ok', service: 'identity', database: 'ok' })
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message)
    res.status(503).json({ status: 'error', service: 'identity', database: 'unreachable' })
  }
})

const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`Servicio de identidad escuchando en http://localhost:${port}`)
})
