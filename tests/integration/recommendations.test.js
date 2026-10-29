// RF-08 Recomendaciones de productos
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { api, requireStack, registerAndLogin, listProducts, URLS } from '../helpers.js'

const NOT_FOUND_ID = '99999999-9999-4999-8999-999999999999'

describe('Recomendaciones', () => {
  let user
  let products = []

  before(async () => {
    await requireStack()
    user = await registerAndLogin('rec')
    products = await listProducts('?limit=100')
  })

  it('[TC-REC-01] Los productos populares son como máximo 10 y vienen ordenados por ventas', async () => {
    const result = await api('/recommendations/popular')
    assert.equal(result.status, 200, result.text)
    assert.equal(result.data.status, 'ok')
    assert.ok(result.data.products.length <= 10)
    const sold = result.data.products.map((p) => p.total_sold)
    assert.deepEqual(sold, [...sold].sort((a, b) => b - a), 'deben estar ordenados de más a menos vendido')
  })

  it('[TC-REC-02] Los productos relacionados son de la misma categoría, con stock y sin incluir el original', async (t) => {
    const original = products.find((p) => products.filter((o) => o.categorySlug === p.categorySlug).length >= 2)
    if (!original) return t.skip('Se necesitan al menos 2 productos en una misma categoría')
    const result = await api(`/recommendations/related/${original.id}`)
    assert.equal(result.status, 200, result.text)
    assert.ok(result.data.products.length <= 6)
    for (const related of result.data.products) {
      assert.notEqual(related.id, original.id)
      assert.equal(related.categoryName, original.categoryName)
      assert.ok(related.stock > 0)
    }
  })

  it('[TC-REC-03] Relacionados con id inválido responde 400 y con id inexistente 404', async () => {
    assert.equal((await api('/recommendations/related/abc')).status, 400)
    assert.equal((await api(`/recommendations/related/${NOT_FOUND_ID}`)).status, 404)
  })

  it('[TC-REC-04] Las recomendaciones personales exigen iniciar sesión (401 sin token)', async () => {
    const result = await api('/recommendations/me')
    assert.equal(result.status, 401)
  })

  it('[TC-REC-05] Un usuario sin compras recibe una lista vacía indicando que no tiene historial', async () => {
    const result = await api('/recommendations/me', { token: user.token })
    assert.equal(result.status, 200, result.text)
    assert.equal(result.data.hasHistory, false)
    assert.deepEqual(result.data.products, [])
  })

  it('[TC-REC-06] El servicio rechaza eventos de compra incompletos (consulta directa al servicio)', async () => {
    const incomplete = [
      {},
      { type: 'OtroEvento' },
      { type: 'OrdenCreada', orderId: NOT_FOUND_ID, userId: NOT_FOUND_ID, purchasedAt: new Date().toISOString(), items: [] },
      { type: 'OrdenCreada', orderId: NOT_FOUND_ID, userId: NOT_FOUND_ID, items: [{ productId: NOT_FOUND_ID, categoryId: 1, quantity: 1 }] }
    ]
    for (const body of incomplete) {
      const result = await api('/events/order-created', { method: 'POST', body, base: URLS.recommendations })
      assert.equal(result.status, 400, `${JSON.stringify(body)} → ${result.status} ${result.text}`)
    }
  })
})
