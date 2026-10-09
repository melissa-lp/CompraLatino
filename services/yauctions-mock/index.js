import express from 'express'
import { readFile } from 'node:fs/promises'

// Simula la API externa de YAuctions
const DATA_FILE = new URL('./data/products.json', import.meta.url)

// Retraso artificial para simular una API de Japón
const SIMULATED_LATENCY_MS = 1000

const app = express()

async function readProducts() {
  return JSON.parse(await readFile(DATA_FILE, 'utf8'))
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'yauctions-mock' })
})

// GET /items — Todos los productos publicados en YAuctions
app.get('/items', async (req, res) => {
  await wait(SIMULATED_LATENCY_MS)
  res.json(await readProducts())
})

// GET /items/YAUC-001 — Detalle de producto
app.get('/items/:itemId', async (req, res) => {
  const products = await readProducts()
  const product = products.find((p) => p.itemId === req.params.itemId)
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' })
  }
  res.json(product)
})

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

// Errores inesperados
app.use((error, req, res, next) => {
  console.error('Error en yauctions-mock:', error.message)
  res.status(500).json({ error: 'YAuctions no pudo procesar la solicitud' })
})

const port = process.env.PORT || 3006

app.listen(port, () => {
  console.log(`[YAuctions Mock] Simulador corriendo en http://localhost:${port}`)
})
