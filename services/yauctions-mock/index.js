import express from 'express'
import { randomUUID } from 'node:crypto'
import { readFile, rename, writeFile } from 'node:fs/promises'

// Simula la API externa de YAuctions
const DATA_FILE = new URL('./data/products.json', import.meta.url)
const TEMP_FILE = new URL('./data/products.json.tmp', import.meta.url)

// Retraso artificial para simular una API de Japón
const SIMULATED_LATENCY_MS = 1000
const PURCHASE_FAILURE_RATE = Number(process.env.PURCHASE_FAILURE_RATE ?? 0)

const app = express()
app.use(express.json())

async function readProducts() {
  return JSON.parse(await readFile(DATA_FILE, 'utf8'))
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Cola de escritura: si llegan dos compras al mismo tiempo, la segunda espera a la primera
let writeQueue = Promise.resolve()

function updateProducts(change) {
  const run = writeQueue.then(async () => {
    const products = await readProducts()
    const result = change(products)
    await writeFile(TEMP_FILE, JSON.stringify(products, null, 2) + '\n')
    await rename(TEMP_FILE, DATA_FILE)
    return result
  })
  writeQueue = run.catch(() => {})
  return run
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

// Error de negocio, se responde con su código HTTP
class PurchaseError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// POST /purchases — compra productos en YAuctions
app.post('/purchases', async (req, res) => {
  const items = req.body?.items
  const isValid =
    Array.isArray(items) &&
    items.length > 0 &&
    items.every((item) => typeof item?.itemId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0)
  if (!isValid) {
    return res.status(400).json({ error: 'Envía items: [{ itemId, quantity }] con cantidades enteras positivas' })
  }

  await wait(SIMULATED_LATENCY_MS)

  if (Math.random() < PURCHASE_FAILURE_RATE) {
    // 503 = servicio no disponible temporalmente 
    return res.status(503).json({ error: 'YAuctions no está disponible en este momento' })
  }

  try {
    const purchase = await updateProducts((products) => {
      for (const item of items) {
        const product = products.find((p) => p.itemId === item.itemId)
        if (!product) throw new PurchaseError(`El producto ${item.itemId} no existe en YAuctions`, 404)
        if (product.stock < item.quantity) {
          throw new PurchaseError(`Stock insuficiente para «${product.title}» (quedan ${product.stock})`, 409)
        }
      }

      let totalJpy = 0
      for (const item of items) {
        const product = products.find((p) => p.itemId === item.itemId)
        product.stock -= item.quantity
        totalJpy += product.priceJpy * item.quantity
      }

      return { purchaseId: `YAP-${randomUUID().slice(0, 8).toUpperCase()}`, items, totalJpy }
    })

    console.log(`Compra ${purchase.purchaseId}:`, items)
    res.status(201).json(purchase)
  } catch (error) {
    if (error instanceof PurchaseError) {
      return res.status(error.status).json({ error: error.message })
    }
    throw error
  }
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
