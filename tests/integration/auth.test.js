// RF-01 Crear cuenta · RF-02 Iniciar sesión. Pasan por el gateway → servicio de identidad
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { api, requireStack, uniqueEmail, PASSWORD, decodeJwt, UUID_REGEX } from '../helpers.js'

describe('Identidad: registro, login y sesión', () => {
  const email = uniqueEmail('auth')
  let token

  before(requireStack)

  it('[TC-AUT-01] Registro válido crea la cuenta con rol customer y sin exponer la contraseña', async () => {
    const result = await api('/auth/register', {
      method: 'POST',
      body: { email, password: PASSWORD, fullName: 'QA Auth' }
    })
    assert.equal(result.status, 201, result.text)
    assert.match(result.data.id, UUID_REGEX)
    assert.equal(result.data.email, email)
    assert.equal(result.data.fullName, 'QA Auth')
    assert.equal(result.data.role, 'customer')
    for (const forbidden of ['password', 'passwordHash', 'password_hash']) {
      assert.ok(!(forbidden in result.data), `la respuesta no debe incluir «${forbidden}»`)
    }
    assert.ok(!result.text.includes(PASSWORD), 'la contraseña no debe aparecer en la respuesta')
  })

  it('[TC-AUT-02] El correo se guarda en minúsculas y sin espacios', async () => {
    const mixed = uniqueEmail('mixed')
    const result = await api('/auth/register', {
      method: 'POST',
      body: { email: `  ${mixed.toUpperCase()}  `, password: PASSWORD, fullName: 'QA Mayúsculas' }
    })
    assert.equal(result.status, 201, result.text)
    assert.equal(result.data.email, mixed)
  })

  it('[TC-AUT-03] No permite registrar dos veces el mismo correo (sin distinguir mayúsculas)', async () => {
    const result = await api('/auth/register', {
      method: 'POST',
      body: { email: email.toUpperCase(), password: PASSWORD, fullName: 'QA Duplicado' }
    })
    assert.equal(result.status, 409, result.text)
    assert.match(result.data.error, /Ya existe una cuenta/)
  })

  it('[TC-AUT-04] Rechaza datos de registro inválidos con 400 y un mensaje claro', async () => {
    const cases = [
      { body: { email: 'sin-arroba', password: PASSWORD, fullName: 'QA' }, error: /correo electrónico no es válido/ },
      { body: { email: 'a@b', password: PASSWORD, fullName: 'QA' }, error: /correo electrónico no es válido/ },
      { body: { password: PASSWORD, fullName: 'QA' }, error: /correo electrónico no es válido/ },
      { body: { email: uniqueEmail('v'), password: '1234567', fullName: 'QA' }, error: /al menos 8 caracteres/ },
      { body: { email: uniqueEmail('v'), password: PASSWORD, fullName: '   ' }, error: /nombre completo es obligatorio/ },
      { body: { email: uniqueEmail('v'), password: 12345678, fullName: 'QA' }, error: /al menos 8 caracteres/ }
    ]
    for (const { body, error } of cases) {
      const result = await api('/auth/register', { method: 'POST', body })
      assert.equal(result.status, 400, `${JSON.stringify(body)} → ${result.text}`)
      assert.match(result.data.error, error)
    }
  })

  it('[TC-AUT-05] Un registro sin cuerpo responde 400, no un error del servidor', async () => {
    const result = await api('/auth/register', { method: 'POST' })
    assert.equal(result.status, 400, result.text)
  })

  it('[TC-AUT-06] Login correcto devuelve token y usuario (el correo se normaliza)', async () => {
    const result = await api('/auth/login', {
      method: 'POST',
      body: { email: `  ${email.toUpperCase()}  `, password: PASSWORD }
    })
    assert.equal(result.status, 200, result.text)
    assert.equal(typeof result.data.token, 'string')
    assert.equal(result.data.token.split('.').length, 3, 'debe ser un JWT de tres partes')
    assert.equal(result.data.user.email, email)
    assert.equal(result.data.user.role, 'customer')
    assert.ok(!('passwordHash' in result.data.user) && !('password_hash' in result.data.user))
    token = result.data.token
  })

  it('[TC-AUT-07] Contraseña incorrecta responde 401', async () => {
    const result = await api('/auth/login', { method: 'POST', body: { email, password: 'otra-contraseña-123' } })
    assert.equal(result.status, 401, result.text)
    assert.equal(result.data.token, undefined)
  })

  it('[TC-AUT-08] Correo inexistente y contraseña incorrecta dan el mismo mensaje (no revela qué cuentas existen)', async () => {
    const wrongPassword = await api('/auth/login', { method: 'POST', body: { email, password: 'otra-contraseña-123' } })
    const unknownUser = await api('/auth/login', {
      method: 'POST',
      body: { email: uniqueEmail('inexistente'), password: PASSWORD }
    })
    assert.equal(unknownUser.status, 401)
    assert.equal(unknownUser.data.error, wrongPassword.data.error)
  })

  it('[TC-AUT-09] Login con campos vacíos o de tipo incorrecto responde 400', async () => {
    const bodies = [{}, { email: '', password: PASSWORD }, { email, password: '' }, { email: 123, password: { a: 1 } }]
    for (const body of bodies) {
      const result = await api('/auth/login', { method: 'POST', body })
      assert.equal(result.status, 400, `${JSON.stringify(body)} → ${result.text}`)
    }
  })

  it('[TC-AUT-10] Un intento de inyección SQL en el login no inicia sesión ni provoca error 500', async () => {
    const payloads = ["' OR '1'='1", "admin'--", "'; DROP TABLE identity.users; --", '" OR ""="']
    for (const payload of payloads) {
      const result = await api('/auth/login', { method: 'POST', body: { email: payload, password: payload } })
      assert.equal(result.status, 401, `«${payload}» → ${result.status} ${result.text}`)
    }
    
    const stillWorks = await api('/auth/login', { method: 'POST', body: { email, password: PASSWORD } })
    assert.equal(stillWorks.status, 200)
  })

  it('[TC-AUT-11] El token contiene solo id y rol, y tiene fecha de expiración', () => {
    const { header, payload } = decodeJwt(token)
    assert.equal(header.alg, 'HS256')
    assert.match(payload.sub, UUID_REGEX)
    assert.equal(payload.role, 'customer')
    assert.ok(payload.exp > payload.iat, 'el token debe expirar')
    assert.ok(payload.exp - payload.iat <= 24 * 3600, 'la sesión no debería durar más de 24 horas')
    for (const key of ['email', 'password', 'passwordHash', 'fullName']) {
      assert.ok(!(key in payload), `el token no debe incluir «${key}»`)
    }
  })

  it('[TC-AUT-12] GET /auth/me devuelve el perfil del usuario autenticado', async () => {
    const result = await api('/auth/me', { token })
    assert.equal(result.status, 200, result.text)
    assert.equal(result.data.email, email)
    assert.ok(result.data.createdAt)
    assert.ok(!('passwordHash' in result.data) && !('password_hash' in result.data))
  })
})
