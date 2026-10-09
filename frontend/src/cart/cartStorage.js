// Carrito guardado en localStorage
const CART_KEY = 'compraLatino_cart'

export function readCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY))
    return Array.isArray(cart) ? cart : []
  } catch {
    return []
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
    return true
  } catch {
    return false
  }
}

export function addToCart(product) {
  const cart = readCart()
  const existing = cart.find((item) => item.id === product.id)

  if (existing) {
    existing.quantity += 1
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      priceJpy: product.priceJpy,
      imageUrl: product.imageUrl,
      quantity: 1
    })
  }
  return saveCart(cart)
}
