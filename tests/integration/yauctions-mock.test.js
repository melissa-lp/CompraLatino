// Integración con YAuctions (simulada)
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { api, URLS } from '../helpers.js'

describe('API de YAuctions (mock): contrato y errores', () => {
  let items

  before(async () => {
    const result = await api('/items', { base: URLS.yauctions })
    assert.equal(result.status, 200, `El mock no responde en ${URLS.yauctions}: ${result.text}`)
    items = result.data
  })

  it('[TC-MCK-01] GET /items lista productos con id, título, precio y stock', () => {
    assert.ok(Array.isArray(items) && items.length > 0)
    for (const item of items) {
      assert.equal(typeof item.itemId, 'string')
      assert.equal(typeof item.title, 'string')
      assert.ok(Number.isInteger(item.priceJpy) && item.priceJpy > 0)
      assert.ok(Number.isInteger(item.stock) && item.stock >= 0)
    }
  })

  it('[TC-MCK-02] GET /items/:id devuelve el detalle, y un id inexistente responde 404', async () => {
    const found = await api(`/items/${items[0].itemId}`, { base: URLS.yauctions })
    assert.equal(found.status, 200)
    assert.equal(found.data.itemId, items[0].itemId)
    const missing = await api('/items/YAUC-NO-EXISTE', { base: URLS.yauctions })
    assert.equal(missing.status, 404)
  })

  it('[TC-MCK-03] POST /purchases rechaza cuerpos inválidos con 400', async () => {
    const invalid = [
      {},
      { items: [] },
      { items: [{ itemId: items[0].itemId, quantity: 0 }] },
      { items: [{ itemId: items[0].itemId, quantity: '1' }] },
      { items: [{ quantity: 1 }] }
    ]
    for (const body of invalid) {
      const result = await api('/purchases', { method: 'POST', body, base: URLS.yauctions })
      assert.equal(result.status, 400, `${JSON.stringify(body)} → ${result.status}`)
    }
  })

  it('[TC-MCK-04] Comprar un producto que no existe en YAuctions responde 404', async () => {
    const result = await api('/purchases', { method: 'POST', body: { items: [{ itemId: 'YAUC-NO-EXISTE', quantity: 1 }] }, base: URLS.yauctions })
    assert.equal(result.status, 404, result.text)
  })

  it('[TC-MCK-05] Comprar más unidades que el stock responde 409 y no descuenta nada', async () => {
    const target = items[0]
    const result = await api('/purchases', { method: 'POST', body: { items: [{ itemId: target.itemId, quantity: target.stock + 1000 }] }, base: URLS.yauctions })
    // El mock puede simular fallos aleatorios (PURCHASE_FAILURE_RATE): 503 es válido solo si está activado
    assert.ok([409, 503].includes(result.status), `→ ${result.status} ${result.text}`)
    if (result.status === 409) {
      const after = await api(`/items/${target.itemId}`, { base: URLS.yauctions })
      assert.equal(after.data.stock, target.stock, 'el stock no debe cambiar tras una compra rechazada')
    }
  })
})
