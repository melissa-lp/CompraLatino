// RNF-01 Seguridad: autenticación, autorización, aislamiento de servicios y endurecimiento.

import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import {
  api, requireStack, registerAndLogin, uniqueEmail, PASSWORD, signJwt, decodeJwt,
  FRONTEND_URL, UUID_REGEX, listProducts
} from '../helpers.js'

const FAKE_USER_ID = '99999999-9999-4999-8999-999999999999'
const JWT_SECRET = process.env.JWT_SECRET

describe('Autenticación y autorización', () => {
  let customer

  before(async () => {
    await requireStack()
    customer = await registerAndLogin('sec')
  })

  it('[TC-SEC-01] Las rutas protegidas responden 401 sin token', async () => {
    const protectedRoutes = [
      ['GET', '/auth/me'],
      ['GET', '/orders'],
      ['GET', `/orders/${FAKE_USER_ID}`],
      ['POST', '/orders/quote'],
      ['POST', '/orders'],
      ['GET', '/recommendations/me'],
      ['GET', '/admin/catalog/metrics'],
      ['POST', '/admin/catalog/sync']
    ]
    for (const [method, path] of protectedRoutes) {
      const result = await api(path, { method, body: method === 'POST' ? {} : undefined })
      assert.equal(result.status, 401, `${method} ${path} → ${result.status}`)
    }
  })

  it('[TC-SEC-02] Un token con la firma alterada es rechazado', async () => {
    const last = customer.token.slice(-1)
    const tampered = customer.token.slice(0, -1) + (last === 'A' ? 'B' : 'A')
    for (const path of ['/auth/me', '/orders']) {
      const result = await api(path, { token: tampered })
      assert.equal(result.status, 401, `${path} → ${result.status}`)
    }
  })

  it('[TC-SEC-03] Un token sin firma (alg: none) que se declara admin es rechazado', async () => {
    const forged = signJwt({ sub: FAKE_USER_ID, role: 'admin' }, null, { alg: 'none', typ: 'JWT' })
    for (const path of ['/admin/catalog/metrics', '/orders', '/auth/me']) {
      const result = await api(path, { token: forged })
      assert.equal(result.status, 401, `${path} → ${result.status}`)
    }
  })

  it('[TC-SEC-04] Un token firmado con otra clave que se declara admin es rechazado', async () => {
    const forged = signJwt({ sub: FAKE_USER_ID, role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 }, 'clave-incorrecta')
    const result = await api('/admin/catalog/metrics', { token: forged })
    assert.equal(result.status, 401, result.text)
  })

  it('[TC-SEC-05] Un token expirado es rechazado (requiere JWT_SECRET en tests/.env)', { skip: !JWT_SECRET && 'Define JWT_SECRET en tests/.env para ejecutarla' }, async () => {
    const { payload } = decodeJwt(customer.token)
    const expired = signJwt({ sub: payload.sub, role: 'customer', iat: payload.iat - 7200, exp: payload.iat - 3600 }, JWT_SECRET)
    for (const path of ['/auth/me', '/orders']) {
      const result = await api(path, { token: expired })
      assert.equal(result.status, 401, `${path} → ${result.status}`)
    }
  })

  it('[TC-SEC-06] Un cliente no puede usar rutas de administración (403)', async () => {
    const metrics = await api('/admin/catalog/metrics', { token: customer.token })
    assert.equal(metrics.status, 403, metrics.text)
    const sync = await api('/admin/catalog/sync', { method: 'POST', token: customer.token })
    assert.equal(sync.status, 403, sync.text)
  })

  it('[TC-SEC-07] Los encabezados x-user-id / x-user-role enviados desde afuera no otorgan acceso', async () => {
    const spoofed = { 'x-user-id': FAKE_USER_ID, 'x-user-role': 'admin' }
    const noToken = await api('/orders', { headers: spoofed })
    assert.equal(noToken.status, 401, `sin token → ${noToken.status}`)
    const admin = await api('/admin/catalog/metrics', { headers: spoofed })
    assert.equal(admin.status, 401, `admin sin token → ${admin.status}`)
    // con un token de cliente, declarar rol admin por encabezado tampoco sirve
    const escalated = await api('/admin/catalog/metrics', { token: customer.token, headers: spoofed })
    assert.equal(escalated.status, 403, `cliente con encabezado admin → ${escalated.status}`)
  })
})

describe('Aislamiento de endpoints internos y entradas maliciosas', () => {
  before(requireStack)

  it('[TC-SEC-08] Los endpoints internos entre servicios no se pueden alcanzar desde el gateway', async () => {
    const internal = await api('/internal/products?ids=' + FAKE_USER_ID)
    assert.equal(internal.status, 404, `/internal/products → ${internal.status}`)
    const event = await api('/events/order-created', {
      method: 'POST',
      body: { type: 'OrdenCreada', orderId: FAKE_USER_ID, userId: FAKE_USER_ID, purchasedAt: new Date().toISOString(), items: [{ productId: FAKE_USER_ID, categoryId: 1, quantity: 1 }] }
    })
    assert.equal(event.status, 404, `/events/order-created → ${event.status}`)
  })

  it('[TC-SEC-09] Intentos de inyección SQL en la búsqueda no rompen el catálogo', async () => {
    const initial = await listProducts()
    for (const q of ["' OR 1=1 --", "'; DROP TABLE catalog.products; --", '" OR ""="', '%27%20OR%201%3D1']) {
      const result = await api(`/products?q=${encodeURIComponent(q)}`)
      assert.equal(result.status, 200, `q=${q} → ${result.status} ${result.text}`)
      assert.ok(Array.isArray(result.data))
      assert.ok(initial.length === 0 || result.data.length < initial.length, `q=${q} no debe devolver todo el catálogo`)
    }
    const after = await listProducts()
    assert.equal(after.length, initial.length, 'la cantidad de productos no debe cambiar')
  })

  it('[TC-SEC-10] Un nombre con HTML se guarda como texto y la API responde JSON (no HTML)', async () => {
    const email = uniqueEmail('xss')
    const payload = '<script>alert(1)</script>'
    const result = await api('/auth/register', { method: 'POST', body: { email, password: PASSWORD, fullName: payload } })
    assert.equal(result.status, 201, result.text)
    assert.match(result.headers.get('content-type') ?? '', /application\/json/)
    assert.equal(result.data.fullName, payload, 'se almacena como dato; el frontend debe mostrarlo escapado (ver TC-UI-12)')
  })

  it('[TC-SEC-11] CORS no se abre a orígenes desconocidos', async () => {
    const evil = 'https://sitio-malicioso.example'
    const result = await api('/products?limit=1', { headers: { Origin: evil } })
    const allowed = result.headers.get('access-control-allow-origin')
    assert.notEqual(allowed, '*', 'no debe permitir cualquier origen')
    assert.notEqual(allowed, evil, 'no debe reflejar un origen desconocido')

    const legit = await api('/products?limit=1', { headers: { Origin: FRONTEND_URL } })
    assert.equal(legit.headers.get('access-control-allow-origin'), FRONTEND_URL)
  })

  it('[TC-SEC-12] Un JSON malformado responde 400 sin filtrar trazas internas (stack trace)', async () => {
    const result = await api('/auth/register', { method: 'POST', body: '{"email": "a@b.com", ' })
    assert.equal(result.status, 400, result.text)
    assert.ok(!/\bat .*\.js:\d+/.test(result.text) && !result.text.includes('node_modules'),
      'la respuesta no debe mostrar rutas de archivos ni la pila de errores')
  })

  it('[TC-SEC-13] Un cuerpo demasiado grande se rechaza con 413', async () => {
    const huge = JSON.stringify({ email: uniqueEmail('big'), password: PASSWORD, fullName: 'x'.repeat(300_000) })
    const result = await api('/auth/register', { method: 'POST', body: huge })
    assert.equal(result.status, 413, `→ ${result.status}`)
  })
})

describe('Endurecimiento (hardening) — pueden revelar incidencias', () => {
  before(requireStack)

  it('[TC-SEC-14] Limita los intentos de login fallidos (fuerza bruta): debe aparecer un 429', async () => {
    const { email } = await registerAndLogin('brute')
    const statuses = []
    for (let attempt = 0; attempt < 15; attempt++) {
      const result = await api('/auth/login', { method: 'POST', body: { email, password: `incorrecta-${attempt}` } })
      statuses.push(result.status)
    }
    assert.ok(statuses.includes(429), `15 intentos fallidos seguidos y ninguno fue bloqueado: ${[...new Set(statuses)]}`)
  })

  it('[TC-SEC-15] No expone el encabezado X-Powered-By (oculta que usa Express)', async () => {
    for (const path of ['/health', '/products?limit=1', '/auth/me']) {
      const result = await api(path)
      assert.equal(result.headers.get('x-powered-by'), null, `${path} expone X-Powered-By: ${result.headers.get('x-powered-by')}`)
    }
  })

  it('[TC-SEC-16] Envía encabezados de seguridad básicos (X-Content-Type-Options)', async () => {
    const result = await api('/products?limit=1')
    assert.equal(result.headers.get('x-content-type-options'), 'nosniff')
  })

  it('[TC-SEC-17] Observación: las estadísticas de recomendaciones no deberían ser públicas', async () => {
    
    const result = await api('/recommendations/stats')
    assert.ok([401, 403, 404].includes(result.status),
      `GET /recommendations/stats respondió ${result.status} sin autenticación y expone: ${result.text.slice(0, 120)}`)
  })
})
