// Pruebas unitarias del cálculo de precios (services/orders/lib/pricing.js)
import { describe, it, mock, afterEach } from 'node:test'
import assert from 'node:assert/strict'

process.env.EXCHANGE_RATE_USD_PER_JPY = '0.0067'
process.env.SERVICE_FEE_USD = '5.00'
process.env.CATALOG_URL = 'http://catalogo.simulado'
const { buildQuote, getPricingConfig } = await import('../../services/orders/lib/pricing.js')

const ID_A = '11111111-1111-4111-8111-111111111111'
const ID_B = '22222222-2222-4222-8222-222222222222'

function product(overrides) {
  return {
    id: ID_A,
    yauctionsItemId: 'YAUC-001',
    title: 'Auriculares de prueba',
    priceJpy: 15000,
    stock: 10,
    isActive: true,
    categoryId: 1,
    imageUrl: null,
    ...overrides
  }
}


function fakeCatalog(products, status = 200) {
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(products), { status }))
}

describe('Cálculo de precios y cotización', () => {
  afterEach(() => mock.restoreAll())

  it('[TC-PRC-01] Expone el tipo de cambio y el cargo por servicio configurados', () => {
    assert.deepEqual(getPricingConfig(), { exchangeRate: 0.0067, serviceFeeUsd: 5 })
  })

  it('[TC-PRC-02] Calcula subtotal en yenes, subtotal en dólares, cargo y total', async () => {
    fakeCatalog([product({ id: ID_A, priceJpy: 15000 }), product({ id: ID_B, priceJpy: 800, yauctionsItemId: 'YAUC-002' })])
    const quote = await buildQuote([
      { productId: ID_A, quantity: 2 },
      { productId: ID_B, quantity: 1 }
    ])
    assert.equal(quote.subtotalJpy, 30800) // 15000×2 + 800
    assert.equal(quote.subtotalUsd, 206.36) // 30800 × 0.0067
    assert.equal(quote.serviceFeeUsd, 5)
    assert.equal(quote.totalUsd, 211.36)
    assert.equal(quote.lines.length, 2)
    assert.equal(quote.lines[0].lineTotalJpy, 30000)
  })

  it('[TC-PRC-03] Redondea al centavo (1 yen = $0.0067 → $0.01)', async () => {
    fakeCatalog([product({ priceJpy: 1 })])
    const quote = await buildQuote([{ productId: ID_A, quantity: 1 }])
    assert.equal(quote.subtotalUsd, 0.01)
    assert.equal(quote.totalUsd, 5.01)
  })

  it('[TC-PRC-04] Rechaza productos inactivos o inexistentes con 409', async () => {
    fakeCatalog([product({ isActive: false })])
    await assert.rejects(buildQuote([{ productId: ID_A, quantity: 1 }]), (error) => error.status === 409)

    fakeCatalog([]) 
    await assert.rejects(buildQuote([{ productId: ID_A, quantity: 1 }]), (error) => error.status === 409)
  })

  it('[TC-PRC-05] Rechaza cantidades mayores al stock indicando cuántas quedan', async () => {
    fakeCatalog([product({ stock: 2 })])
    await assert.rejects(
      buildQuote([{ productId: ID_A, quantity: 3 }]),
      (error) => error.status === 409 && /Solo quedan 2 unidades/.test(error.message)
    )
  
    const quote = await buildQuote([{ productId: ID_A, quantity: 2 }])
    assert.equal(quote.lines[0].quantity, 2)
  })

  it('[TC-PRC-06] Responde 503 si el catálogo no responde y 502 si responde con error', async () => {
    mock.method(globalThis, 'fetch', async () => {
      throw new TypeError('fetch failed')
    })
    await assert.rejects(buildQuote([{ productId: ID_A, quantity: 1 }]), (error) => error.status === 503)

    mock.restoreAll()
    fakeCatalog({ error: 'boom' }, 500)
    await assert.rejects(buildQuote([{ productId: ID_A, quantity: 1 }]), (error) => error.status === 502)
  })
})
