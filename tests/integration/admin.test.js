// RF-09 Herramientas administrativas (métricas y sincronización del catálogo)
// Requiere una cuenta con rol admin
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { api, requireStack, listProducts } from '../helpers.js'

const { ADMIN_EMAIL, ADMIN_PASSWORD, QA_RUN_SYNC } = process.env
const skipReason = (!ADMIN_EMAIL || !ADMIN_PASSWORD) && 'Define ADMIN_EMAIL y ADMIN_PASSWORD en tests/.env'

describe('Administración', { skip: skipReason }, () => {
  let token

  before(async () => {
    await requireStack()
    const login = await api('/auth/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
    assert.equal(login.status, 200, `No se pudo iniciar sesión como admin: ${login.text}`)
    assert.equal(login.data.user.role, 'admin', 'la cuenta no tiene rol admin (revisa el update en Supabase y vuelve a iniciar sesión)')
    token = login.data.token
  })

  it('[TC-ADM-01] Un admin puede consultar las métricas del catálogo', async () => {
    const result = await api('/admin/catalog/metrics', { token })
    assert.equal(result.status, 200, result.text)
    for (const field of ['totalProducts', 'totalItemsStock', 'totalInventoryValueJpy', 'activeCategories']) {
      assert.equal(typeof result.data[field], 'number', `${field} debe ser numérico`)
      assert.ok(result.data[field] >= 0)
    }
  })

  it('[TC-ADM-02] Las métricas coinciden con lo que muestra el catálogo público', async () => {
    const metrics = (await api('/admin/catalog/metrics', { token })).data
    const products = await listProducts()
    assert.equal(metrics.totalProducts, products.length)
    assert.equal(metrics.totalItemsStock, products.reduce((sum, p) => sum + p.stock, 0))
    assert.equal(metrics.totalInventoryValueJpy, products.reduce((sum, p) => sum + p.priceJpy * p.stock, 0))
  })

  it('[TC-ADM-03] La sincronización con YAuctions responde con un resumen y deja productos en el catálogo', { skip: QA_RUN_SYNC !== '1' && 'Pon QA_RUN_SYNC=1 para ejecutarla (modifica el catálogo)' }, async () => {
    const result = await api('/admin/catalog/sync', { method: 'POST', token })
    assert.equal(result.status, 200, result.text)
    assert.ok((await listProducts()).length > 0)
  })
})
