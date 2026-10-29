// Utilidades compartidas por las pruebas de integración.

import { createHmac } from 'node:crypto'

export const URLS = {
  gateway: process.env.BASE_URL ?? 'http://localhost:3000',
  identity: process.env.IDENTITY_URL ?? 'http://localhost:3001',
  catalog: process.env.CATALOG_URL ?? 'http://localhost:3002',
  orders: process.env.ORDERS_URL ?? 'http://localhost:3003',
  recommendations: process.env.RECOMMENDATIONS_URL ?? 'http://localhost:3004',
  yauctions: process.env.YAUCTIONS_URL ?? 'http://localhost:3006'
}

export const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'
export const PASSWORD = 'QaPassw0rd!2026'
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const SHIPPING = {
  fullName: 'QA Tester',
  phone: '+503 7000-0000',
  country: 'El Salvador',
  city: 'San Salvador',
  address: 'Calle de prueba 123, colonia QA'
}

// Petición HTTP 
export async function api(path, { method = 'GET', token, body, headers = {}, base = URLS.gateway } = {}) {
  const finalHeaders = { ...headers }
  if (token) finalHeaders.Authorization = `Bearer ${token}`
  let payload
  if (body !== undefined) {
    finalHeaders['Content-Type'] ??= 'application/json'
    payload = typeof body === 'string' ? body : JSON.stringify(body)
  }
  const response = await fetch(base + path, {
    method,
    headers: finalHeaders,
    body: payload,
    signal: AbortSignal.timeout(20000)
  })
  const text = await response.text()
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    // la respuesta no era JSON
  }
  return { status: response.status, headers: response.headers, data, text }
}

// Falla con un mensaje si el gateway no está levantado
export async function requireStack() {
  let result
  try {
    result = await api('/health')
  } catch (error) {
    throw new Error(`No se pudo contactar el gateway en ${URLS.gateway}. ¿Levantaste los servicios? (${error.message})`)
  }
  if (result.status !== 200) {
    throw new Error(`El gateway respondió ${result.status} en /health`)
  }
}

// Correos reconocibles
export function uniqueEmail(tag = 'u') {
  return `qa.${tag}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}@example.com`
}

// Crea una cuenta nueva e inicia sesión
export async function registerAndLogin(tag = 'u') {
  const email = uniqueEmail(tag)
  const register = await api('/auth/register', {
    method: 'POST',
    body: { email, password: PASSWORD, fullName: `QA ${tag}` }
  })
  if (register.status !== 201) {
    throw new Error(`No se pudo registrar ${email}: ${register.status} ${register.text}`)
  }
  const login = await api('/auth/login', { method: 'POST', body: { email, password: PASSWORD } })
  if (login.status !== 200) {
    throw new Error(`No se pudo iniciar sesión con ${email}: ${login.status} ${login.text}`)
  }
  return { email, token: login.data.token, user: login.data.user }
}

// Productos activos con stock, desde el catálogo público
export async function listProducts(query = '') {
  const result = await api(`/products${query}`)
  if (result.status !== 200 || !Array.isArray(result.data)) {
    throw new Error(`No se pudo leer el catálogo: ${result.status} ${result.text}`)
  }
  return result.data
}

// JWT (HS256) para fabricar tokens inválidos en las pruebas de seguridad
const b64url = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url')

export function signJwt(payload, secret, header = { alg: 'HS256', typ: 'JWT' }) {
  const unsigned = `${b64url(header)}.${b64url(payload)}`
  const signature = secret === null ? '' : createHmac('sha256', secret).update(unsigned).digest('base64url')
  return `${unsigned}.${signature}`
}

export function decodeJwt(token) {
  const [header, payload] = token.split('.')
  return {
    header: JSON.parse(Buffer.from(header, 'base64url').toString()),
    payload: JSON.parse(Buffer.from(payload, 'base64url').toString())
  }
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
