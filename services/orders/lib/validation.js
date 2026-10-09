import { UUID_REGEX } from '../middleware/currentUser.js'

const MAX_ITEMS = 50
const MAX_QUANTITY = 99

export function parseItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'El carrito está vacío' }
  }
  if (items.length > MAX_ITEMS) {
    return { error: `Se permiten como máximo ${MAX_ITEMS} productos distintos por orden` }
  }

  const quantities = new Map()
  for (const item of items) {
    if (typeof item?.productId !== 'string' || !UUID_REGEX.test(item.productId)) {
      return { error: 'Hay un producto con un id inválido' }
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      return { error: `Cada cantidad debe ser un entero entre 1 y ${MAX_QUANTITY}` }
    }
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
  }

  const merged = [...quantities].map(([productId, quantity]) => ({ productId, quantity }))
  if (merged.some((item) => item.quantity > MAX_QUANTITY)) {
    return { error: `Cada cantidad debe ser un entero entre 1 y ${MAX_QUANTITY}` }
  }
  return { items: merged }
}

function requiredText(value, maxLength) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text !== '' && text.length <= maxLength ? text : null
}

// Dirección de envío
export function parseShipping(shipping) {
  const parsed = {
    fullName: requiredText(shipping?.fullName, 120),
    phone: requiredText(shipping?.phone, 30),
    country: requiredText(shipping?.country, 60),
    city: requiredText(shipping?.city, 80),
    address: requiredText(shipping?.address, 250)
  }
  const labels = { fullName: 'nombre', phone: 'teléfono', country: 'país', city: 'ciudad', address: 'dirección' }

  for (const [field, value] of Object.entries(parsed)) {
    if (value === null) return { error: `Revisa el campo ${labels[field]} de la dirección de envío` }
  }
  // Solo dígitos, espacios, +, guiones y paréntesis
  if (!/^[0-9+\-()\s]{7,30}$/.test(parsed.phone)) {
    return { error: 'El teléfono no es válido' }
  }
  return { shipping: parsed }
}
