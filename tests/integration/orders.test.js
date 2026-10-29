// RF-05 Carrito y cotización · RF-06 Comprar vía YAuctions · RF-07 Historial y seguimiento de órdenes

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import {
  api, requireStack, registerAndLogin, listProducts, SHIPPING, UUID_REGEX, sleep, URLS
} from '../helpers.js'

const SKIP_PURCHASE = process.env.QA_SKIP_PURCHASE === '1'
const NOT_FOUND_ID = '99999999-9999-4999-8999-999999999999'

describe('Órdenes: cotización, compra, historial y recomendaciones', () => {
  let buyer
  let stranger
  let product
  let order

  before(async () => {
    await requireStack()
    buyer = await registerAndLogin('buyer')
    stranger = await registerAndLogin('stranger')
    const products = await listProducts('?limit=100')
    product = products.find((p) => p.stock >= 3) ?? products.find((p) => p.stock >= 1)
  })

  function needProduct(t) {
    if (!product) {
      t.skip('No hay productos con stock en el catálogo')
      return false
    }
    return true
  }

  it('[TC-ORD-01] GET /pricing devuelve el tipo de cambio y el cargo por servicio', async () => {
    const result = await api('/pricing')
    assert.equal(result.status, 200, result.text)
    assert.ok(result.data.exchangeRate > 0)
    assert.ok(result.data.serviceFeeUsd >= 0)
  })

  it('[TC-ORD-02] La cotización calcula subtotal, cargo y total de forma coherente', async (t) => {
    if (!needProduct(t)) return
    const result = await api('/orders/quote', { method: 'POST', token: buyer.token, body: { items: [{ productId: product.id, quantity: 2 }] } })
    assert.equal(result.status, 200, result.text)
    const quote = result.data
    assert.equal(quote.lines.length, 1)
    assert.equal(quote.lines[0].lineTotalJpy, product.priceJpy * 2)
    assert.equal(quote.subtotalJpy, product.priceJpy * 2)
    const expectedSubtotalUsd = Math.round(quote.subtotalJpy * quote.exchangeRate * 100) / 100
    assert.equal(quote.subtotalUsd, expectedSubtotalUsd)
    assert.equal(Math.round(quote.totalUsd * 100), Math.round((quote.subtotalUsd + quote.serviceFeeUsd) * 100))
  })

  it('[TC-ORD-03] Un producto repetido en el carrito se une en una sola línea', async (t) => {
    if (!needProduct(t)) return
    const result = await api('/orders/quote', {
      method: 'POST',
      token: buyer.token,
      body: { items: [{ productId: product.id, quantity: 1 }, { productId: product.id, quantity: 1 }] }
    })
    assert.equal(result.status, 200, result.text)
    assert.equal(result.data.lines.length, 1)
    assert.equal(result.data.lines[0].quantity, 2)
  })

  it('[TC-ORD-04] La cotización rechaza carritos vacíos, ids inválidos y cantidades fuera de rango (400)', async () => {
    const invalid = [
      {},
      { items: [] },
      { items: [{ productId: 'abc', quantity: 1 }] },
      { items: [{ productId: NOT_FOUND_ID, quantity: 0 }] },
      { items: [{ productId: NOT_FOUND_ID, quantity: 100 }] },
      { items: [{ productId: NOT_FOUND_ID, quantity: 1.5 }] },
      { items: [{ productId: NOT_FOUND_ID, quantity: '2' }] }
    ]
    for (const body of invalid) {
      const result = await api('/orders/quote', { method: 'POST', token: buyer.token, body })
      assert.equal(result.status, 400, `${JSON.stringify(body)} → ${result.status} ${result.text}`)
    }
  })

  it('[TC-ORD-05] Un producto inexistente en el carrito se rechaza con 409', async () => {
    const result = await api('/orders/quote', { method: 'POST', token: buyer.token, body: { items: [{ productId: NOT_FOUND_ID, quantity: 1 }] } })
    assert.equal(result.status, 409, result.text)
    assert.ok(result.data.error)
  })

  it('[TC-ORD-06] Pedir más unidades que el stock se rechaza con 409 e indica cuántas quedan', async (t) => {
    if (!needProduct(t)) return
    if (product.stock >= 99) return t.skip('El stock supera el máximo por línea (99)')
    const result = await api('/orders/quote', { method: 'POST', token: buyer.token, body: { items: [{ productId: product.id, quantity: product.stock + 1 }] } })
    assert.equal(result.status, 409, result.text)
    assert.match(result.data.error, /Solo quedan/)
  })

  it('[TC-ORD-07] Crear una orden con dirección incompleta o teléfono inválido responde 400', async (t) => {
    if (!needProduct(t)) return
    const items = [{ productId: product.id, quantity: 1 }]
    const badShipping = [
      undefined,
      { ...SHIPPING, fullName: '' },
      { ...SHIPPING, address: '   ' },
      { ...SHIPPING, phone: 'no-es-un-telefono' }
    ]
    for (const shipping of badShipping) {
      const result = await api('/orders', { method: 'POST', token: buyer.token, body: { items, shipping } })
      assert.equal(result.status, 400, `${JSON.stringify(shipping)} → ${result.status} ${result.text}`)
    }
    const history = await api('/orders', { token: buyer.token })
    assert.deepEqual(history.data, [], 'ninguna de esas peticiones debe haber creado una orden')
  })

  it('[TC-ORD-08] Compra exitosa: la orden queda «purchased» con id de YAuctions e historial de estados', { skip: SKIP_PURCHASE && 'QA_SKIP_PURCHASE=1' }, async (t) => {
    if (!needProduct(t)) return
    const quote = (await api('/orders/quote', { method: 'POST', token: buyer.token, body: { items: [{ productId: product.id, quantity: 1 }] } })).data
    const result = await api('/orders', { method: 'POST', token: buyer.token, body: { items: [{ productId: product.id, quantity: 1 }], shipping: SHIPPING } })
    assert.equal(result.status, 201, result.text)
    order = result.data
    assert.match(order.id, UUID_REGEX)
    assert.equal(order.status, 'purchased')
    assert.match(order.yauctionsPurchaseId, /^YAP-/)
    assert.equal(order.totalUsd, quote.totalUsd, 'el total cobrado debe coincidir con la cotización')
    assert.equal(order.subtotalJpy, quote.subtotalJpy)
    assert.equal(order.shipping.city, SHIPPING.city)
    assert.equal(order.items.length, 1)
    assert.equal(order.items[0].quantity, 1)
    assert.deepEqual(order.history.map((h) => h.status), ['pending', 'purchased'])
  })

  it('[TC-ORD-09] El historial de compras lista la orden creada con su total y unidades', { skip: SKIP_PURCHASE && 'QA_SKIP_PURCHASE=1' }, async () => {
    const result = await api('/orders', { token: buyer.token })
    assert.equal(result.status, 200, result.text)
    assert.equal(result.data.length, 1)
    assert.equal(result.data[0].id, order.id)
    assert.equal(result.data[0].unitCount, 1)
    assert.equal(result.data[0].totalUsd, order.totalUsd)
  })

  it('[TC-ORD-10] Un usuario nuevo tiene el historial vacío', async () => {
    const result = await api('/orders', { token: stranger.token })
    assert.equal(result.status, 200)
    assert.deepEqual(result.data, [])
  })

  it('[TC-ORD-11] Se puede ver el detalle de una orden propia, y una ajena responde 404', { skip: SKIP_PURCHASE && 'QA_SKIP_PURCHASE=1' }, async () => {
    const own = await api(`/orders/${order.id}`, { token: buyer.token })
    assert.equal(own.status, 200, own.text)
    assert.equal(own.data.id, order.id)

    const foreign = await api(`/orders/${order.id}`, { token: stranger.token })
    assert.equal(foreign.status, 404, 'no debe revelar órdenes de otros usuarios')
  })

  it('[TC-ORD-12] Ids de orden mal formados o inexistentes responden 404', async () => {
    for (const id of ['abc', '123', NOT_FOUND_ID, "1' OR '1'='1"]) {
      const result = await api(`/orders/${encodeURIComponent(id)}`, { token: buyer.token })
      assert.equal(result.status, 404, `${id} → ${result.status} ${result.text}`)
    }
  })

  it('[TC-ORD-13] Tras una compra, Recomendaciones registra el historial y personaliza sin repetir lo comprado', { skip: SKIP_PURCHASE && 'QA_SKIP_PURCHASE=1' }, async () => {
    let result
    for (let attempt = 0; attempt < 8; attempt++) {
      result = await api('/recommendations/me', { token: buyer.token })
      if (result.data?.hasHistory) break
      await sleep(1000) // el evento OrdenCreada se publica de forma asíncrona
    }
    assert.equal(result.status, 200, result.text)
    assert.equal(result.data.hasHistory, true,
      'No se registró la compra. Revisa que orders/.env tenga RECOMMENDATIONS_URL=http://localhost:3004 (en .env.example viene vacío)')
    assert.ok(Array.isArray(result.data.products))
    assert.ok(!result.data.products.some((p) => p.id === product.id), 'no debe recomendar un producto que el usuario ya compró')
  })

  it('[TC-ORD-14] Un JSON malformado en /orders responde 400 con un mensaje claro', async () => {
    const result = await api('/orders', { method: 'POST', token: buyer.token, body: '{"items": [' })
    assert.equal(result.status, 400, result.text)
    assert.ok(result.data?.error)
  })

  it('[TC-ORD-15] Un cuerpo mayor a 100 KB se rechaza con 413 (no con 500)', async () => {
    const huge = JSON.stringify({ items: [], shipping: { address: 'x'.repeat(200_000) } })
    const result = await api('/orders', { method: 'POST', token: buyer.token, body: huge })
    assert.equal(result.status, 413, `→ ${result.status} ${result.text}`)
  })
})
