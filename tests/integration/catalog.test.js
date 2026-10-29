// RF-03 Buscar y filtrar productos · RF-04 Ver el catálogo y las categorías

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { api, requireStack, listProducts, UUID_REGEX } from '../helpers.js'

describe('Catálogo: listado, búsqueda, filtros y categorías', () => {
  let products = []

  before(async () => {
    await requireStack()
    products = await listProducts()
  })

  function needProducts(t) {
    if (products.length === 0) {
      t.skip('El catálogo está vacío: sincronízalo con POST /admin/catalog/sync')
      return false
    }
    return true
  }

  it('[TC-CAT-01] GET /products devuelve productos con los campos esperados', async (t) => {
    if (!needProducts(t)) return
    for (const product of products) {
      assert.match(product.id, UUID_REGEX)
      assert.equal(typeof product.title, 'string')
      assert.ok(Number.isInteger(product.priceJpy) && product.priceJpy > 0, `precio inválido en ${product.title}`)
      assert.ok(Number.isInteger(product.stock) && product.stock >= 0, `stock inválido en ${product.title}`)
      assert.equal(typeof product.categorySlug, 'string')
      assert.ok(product.imageUrl === null || typeof product.imageUrl === 'string')
    }
  })

  it('[TC-CAT-02] La búsqueda por texto solo devuelve coincidencias en título o categoría', async (t) => {
    if (!needProducts(t)) return
    const word = products[0].title.split(/\s+/).find((w) => w.length >= 4) ?? products[0].title
    const result = await api(`/products?q=${encodeURIComponent(word.toUpperCase())}`)
    assert.equal(result.status, 200, result.text)
    assert.ok(result.data.some((p) => p.id === products[0].id), 'debe incluir el producto del que salió la palabra (sin distinguir mayúsculas)')
    for (const p of result.data) {
      const haystack = `${p.title} ${p.categoryName}`.toLowerCase()
      assert.ok(haystack.includes(word.toLowerCase()), `«${p.title}» no coincide con «${word}»`)
    }
  })

  it('[TC-CAT-03] Una búsqueda sin coincidencias devuelve una lista vacía (no un error)', async () => {
    const result = await api('/products?q=zzzz-no-existe-9876')
    assert.equal(result.status, 200)
    assert.deepEqual(result.data, [])
  })

  it('[TC-CAT-04] El filtro por categoría solo devuelve productos de esa categoría', async (t) => {
    if (!needProducts(t)) return
    const slug = products[0].categorySlug
    const result = await api(`/products?category=${encodeURIComponent(slug)}`)
    assert.equal(result.status, 200)
    assert.ok(result.data.length > 0)
    assert.ok(result.data.every((p) => p.categorySlug === slug))
    const unknown = await api('/products?category=categoria-inexistente')
    assert.deepEqual(unknown.data, [])
  })

  it('[TC-CAT-05] Ordena por precio ascendente y descendente', async (t) => {
    if (!needProducts(t)) return
    const asc = (await api('/products?sort=price_asc')).data.map((p) => p.priceJpy)
    const desc = (await api('/products?sort=price_desc')).data.map((p) => p.priceJpy)
    assert.deepEqual(asc, [...asc].sort((a, b) => a - b), 'price_asc no está ordenado de menor a mayor')
    assert.deepEqual(desc, [...desc].sort((a, b) => b - a), 'price_desc no está ordenado de mayor a menor')
  })

  it('[TC-CAT-06] El parámetro limit acota los resultados y rechaza valores inválidos', async (t) => {
    if (!needProducts(t)) return
    const limited = await api('/products?limit=2')
    assert.equal(limited.status, 200)
    assert.ok(limited.data.length <= 2)
    for (const bad of ['0', '101', '-1', 'abc', '1.5']) {
      const result = await api(`/products?limit=${bad}`)
      assert.equal(result.status, 400, `limit=${bad} → ${result.status}`)
    }
  })

  it('[TC-CAT-07] Una búsqueda de más de 100 caracteres responde 400 (y 100 sí se acepta)', async () => {
    assert.equal((await api(`/products?q=${'a'.repeat(101)}`)).status, 400)
    assert.equal((await api(`/products?q=${'a'.repeat(100)}`)).status, 200)
  })

  it('[TC-CAT-08] Los comodines % y _ se buscan como texto literal, no como patrón', async () => {
    for (const wildcard of ['%', '_']) {
      const result = await api(`/products?q=${encodeURIComponent(wildcard)}`)
      assert.equal(result.status, 200)
      for (const p of result.data) {
        assert.ok(`${p.title} ${p.categoryName}`.includes(wildcard), `«${wildcard}» devolvió «${p.title}», que no lo contiene`)
      }
    }
  })

  it('[TC-CAT-09] GET /categories lista las categorías con su cantidad de productos', async () => {
    const result = await api('/categories')
    assert.equal(result.status, 200, result.text)
    assert.ok(Array.isArray(result.data) && result.data.length > 0, 'debe haber categorías sembradas')
    for (const category of result.data) {
      assert.equal(typeof category.name, 'string')
      assert.equal(typeof category.slug, 'string')
      assert.ok(Number.isInteger(category.productCount) && category.productCount >= 0)
    }
  })

  it('[TC-CAT-10] La suma de productos por categoría coincide con el total del catálogo', async () => {
    const categories = (await api('/categories')).data
    const total = categories.reduce((sum, c) => sum + c.productCount, 0)
    assert.equal(total, products.length)
  })

  it('[TC-CAT-11] El listado responde en menos de 3 segundos', async () => {
    const started = performance.now()
    const result = await api('/products')
    const elapsed = performance.now() - started
    assert.equal(result.status, 200)
    assert.ok(elapsed < 3000, `tardó ${Math.round(elapsed)} ms`)
  })

  it('[TC-CAT-12] Una ruta inexistente responde 404 en JSON', async () => {
    const result = await api('/ruta-que-no-existe')
    assert.equal(result.status, 404)
    assert.ok(result.data?.error, 'debe responder un JSON con «error»')
  })
})
