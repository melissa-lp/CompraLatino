import express from 'express'
import sql from './db.js'
import authRoutes from './routes/auth.js'
import { readFileSync } from 'node:fs'
import { parse } from 'yaml'
import swaggerui from 'swagger-ui-express'

if (!process.env.JWT_SECRET) {
  console.error('Falta la variable de entorno JWT_SECRET')
  process.exit(1)
}

const app = express()

// Permite leer el cuerpo de las peticiones en formato JSON (registro y login)
app.use(express.json())
app.use('/auth', authRoutes)
const openapiSpec = parse(readFileSync(new URL('./openapi.yaml', import.meta.url), 'utf-8'))
app.use('/docs', swaggerui.serve, swaggerui.setup(openapiSpec))

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
