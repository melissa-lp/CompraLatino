import { OrderError } from './errors.js'

const EXCHANGE_RATE = Number(process.env.EXCHANGE_RATE_USD_PER_JPY)
const SERVICE_FEE_USD = Number(process.env.SERVICE_FEE_USD)

async function fetchCatalogProducts(productIds) {
  let response
  try {
    response = await fetch(`${process.env.CATALOG_URL}/internal/products?ids=${productIds.join(',')}`)
  } catch {
    throw new OrderError('El catálogo no está disponible, intenta más tarde', 503)
  }
  if (!response.ok) {
    throw new OrderError('No se pudieron consultar los productos', 502)
  }
  return response.json()
}

function toCents(usd) {
  return Math.round(usd * 100)
}

// Cotización de una lista de productos
export async function buildQuote(items) {
  const products = await fetchCatalogProducts(items.map((item) => item.productId))
  const productsById = new Map(products.map((product) => [product.id, product]))

  const lines = []
  for (const item of items) {
    const product = productsById.get(item.productId)
    if (!product || !product.isActive) {
      throw new OrderError('Uno de los productos del carrito ya no está disponible. Quítalo para continuar.', 409)
    }
    if (item.quantity > product.stock) {
      throw new OrderError(`Solo quedan ${product.stock} unidades de «${product.title}»`, 409)
    }
    lines.push({
      productId: product.id,
      yauctionsItemId: product.yauctionsItemId,
      categoryId: product.categoryId,
      title: product.title,
      imageUrl: product.imageUrl,
      unitPriceJpy: product.priceJpy,
      quantity: item.quantity,
      lineTotalJpy: product.priceJpy * item.quantity
    })
  }

  const subtotalJpy = lines.reduce((sum, line) => sum + line.lineTotalJpy, 0)
  const subtotalUsdCents = Math.round(subtotalJpy * EXCHANGE_RATE * 100)
  const serviceFeeCents = toCents(SERVICE_FEE_USD)
  const totalCents = subtotalUsdCents + serviceFeeCents

  return {
    lines,
    subtotalJpy,
    exchangeRate: EXCHANGE_RATE,
    subtotalUsd: subtotalUsdCents / 100,
    serviceFeeUsd: serviceFeeCents / 100,
    totalUsd: totalCents / 100
  }
}
