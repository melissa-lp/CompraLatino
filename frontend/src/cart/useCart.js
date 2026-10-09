import { useContext } from 'react'
import { CartContext } from './CartContext.js'

export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) {
    throw new Error('useCart debe usarse dentro de <CartProvider>')
  }
  return cart
}
