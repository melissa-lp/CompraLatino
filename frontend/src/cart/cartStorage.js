// Carrito guardado en localStorage
export const CART_KEY = 'compraLatino_cart'

function isValidItem(item) {
  return (
    item &&
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    Number.isInteger(item.priceJpy) &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  )
}

export function readCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY))
    return Array.isArray(cart) ? cart.filter(isValidItem) : []
  } catch {
    return []
  }
}

export function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  } catch {
    
  }
}
