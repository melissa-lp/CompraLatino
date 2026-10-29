// RNF-04 Disponibilidad: cada servicio informa su estado
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { api, URLS } from '../helpers.js'

describe('Estado de los servicios (/health)', () => {
  const services = [
    ['gateway', URLS.gateway, 'TC-HLT-01'],
    ['identity', URLS.identity, 'TC-HLT-02'],
    ['catalog', URLS.catalog, 'TC-HLT-03'],
    ['orders', URLS.orders, 'TC-HLT-04'],
    ['recommendations', URLS.recommendations, 'TC-HLT-05'],
    ['yauctions-mock', URLS.yauctions, 'TC-HLT-06']
  ]

  for (const [name, base, id] of services) {
    it(`[${id}] El servicio ${name} responde «ok»${name === 'gateway' || name === 'yauctions-mock' ? '' : ' y está conectado a la base de datos'}`, async () => {
      const result = await api('/health', { base })
      assert.equal(result.status, 200, `${name} en ${base} → ${result.status} ${result.text}`)
      assert.equal(result.data.status, 'ok')
      if (result.data.database !== undefined) {
        assert.ok(['ok', 'connected'].includes(result.data.database), `database: ${result.data.database}`)
      }
    })
  }
})
