// Pruebas unitarias de la validación de órdenes (services/orders/lib/validation.js)

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseItems, parseShipping } from '../../services/orders/lib/validation.js'

const ID_A = '11111111-1111-4111-8111-111111111111'
const ID_B = '22222222-2222-4222-8222-222222222222'

const validShipping = {
  fullName: 'Ana Pérez',
  phone: '+503 7000-0000',
  country: 'El Salvador',
  city: 'Santa Tecla',
  address: 'Colonia Escalón, casa 5'
}

describe('Validación del carrito (parseItems)', () => {
  it('[TC-VAL-01] Rechaza un carrito vacío o que no es una lista', () => {
    assert.equal(parseItems([]).error, 'El carrito está vacío')
    assert.equal(parseItems(undefined).error, 'El carrito está vacío')
    assert.equal(parseItems('abc').error, 'El carrito está vacío')
  })

  it('[TC-VAL-02] Rechaza ids de producto que no son UUID', () => {
    assert.equal(parseItems([{ productId: 'abc', quantity: 1 }]).error, 'Hay un producto con un id inválido')
    assert.equal(parseItems([{ quantity: 1 }]).error, 'Hay un producto con un id inválido')
    assert.equal(parseItems([null]).error, 'Hay un producto con un id inválido')
  })

  it('[TC-VAL-03] Rechaza cantidades fuera de 1–99 o no enteras', () => {
    for (const quantity of [0, -1, 100, 1.5, '2', null, NaN]) {
      const result = parseItems([{ productId: ID_A, quantity }])
      assert.match(result.error, /entero entre 1 y 99/, `cantidad ${String(quantity)} debería rechazarse`)
    }
  })

  it('[TC-VAL-04] Acepta cantidades en los límites (1 y 99)', () => {
    assert.deepEqual(parseItems([{ productId: ID_A, quantity: 1 }]).items, [{ productId: ID_A, quantity: 1 }])
    assert.deepEqual(parseItems([{ productId: ID_A, quantity: 99 }]).items, [{ productId: ID_A, quantity: 99 }])
  })

  it('[TC-VAL-05] Suma las cantidades de un mismo producto repetido', () => {
    const result = parseItems([
      { productId: ID_A, quantity: 2 },
      { productId: ID_B, quantity: 1 },
      { productId: ID_A, quantity: 3 }
    ])
    assert.deepEqual(result.items, [
      { productId: ID_A, quantity: 5 },
      { productId: ID_B, quantity: 1 }
    ])
  })

  it('[TC-VAL-06] Rechaza si la suma de un producto repetido supera 99', () => {
    const result = parseItems([
      { productId: ID_A, quantity: 60 },
      { productId: ID_A, quantity: 60 }
    ])
    assert.match(result.error, /entero entre 1 y 99/)
  })

  it('[TC-VAL-07] Rechaza más de 50 productos distintos por orden', () => {
    const items = Array.from({ length: 51 }, (_, index) => ({
      productId: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
      quantity: 1
    }))
    assert.match(parseItems(items).error, /máximo 50 productos/)
    assert.ok(parseItems(items.slice(0, 50)).items, 'con 50 productos sí debe aceptarse')
  })
})

describe('Validación de la dirección de envío (parseShipping)', () => {
  it('[TC-VAL-08] Acepta una dirección completa y válida', () => {
    assert.deepEqual(parseShipping(validShipping).shipping, validShipping)
  })

  it('[TC-VAL-09] Rechaza cada campo faltante o vacío indicando cuál es', () => {
    const labels = { fullName: 'nombre', phone: 'teléfono', country: 'país', city: 'ciudad', address: 'dirección' }
    for (const [field, label] of Object.entries(labels)) {
      assert.equal(
        parseShipping({ ...validShipping, [field]: '   ' }).error,
        `Revisa el campo ${label} de la dirección de envío`
      )
      const { [field]: _omitted, ...incomplete } = validShipping
      assert.equal(parseShipping(incomplete).error, `Revisa el campo ${label} de la dirección de envío`)
    }
    assert.ok(parseShipping(undefined).error, 'sin dirección debe fallar')
  })

  it('[TC-VAL-10] Valida el formato del teléfono', () => {
    for (const phone of ['abc1234567', '123', '+503 7000-0000; DROP TABLE']) {
      assert.equal(parseShipping({ ...validShipping, phone }).error, 'El teléfono no es válido', `teléfono «${phone}»`)
    }
    // más de 30 caracteres lo rechaza primero el límite de largo del campo
    assert.equal(
      parseShipping({ ...validShipping, phone: '1'.repeat(31) }).error,
      'Revisa el campo teléfono de la dirección de envío'
    )
    for (const phone of ['+503 7000-0000', '(503) 2222 3333', '70000000']) {
      assert.ok(parseShipping({ ...validShipping, phone }).shipping, `teléfono «${phone}» es válido`)
    }
  })

  it('[TC-VAL-11] Recorta espacios y respeta los largos máximos', () => {
    const trimmed = parseShipping({ ...validShipping, fullName: '  Ana Pérez  ' })
    assert.equal(trimmed.shipping.fullName, 'Ana Pérez')
    assert.ok(parseShipping({ ...validShipping, address: 'x'.repeat(250) }).shipping, '250 caracteres es el máximo permitido')
    assert.ok(parseShipping({ ...validShipping, address: 'x'.repeat(251) }).error, '251 caracteres debe rechazarse')
    assert.ok(parseShipping({ ...validShipping, fullName: 'x'.repeat(121) }).error, 'nombre de 121 caracteres debe rechazarse')
  })
})
