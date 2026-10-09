import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from './CartContext.js'
import { CART_KEY, readCart, saveCart } from './cartStorage.js'

// Límite por producto
export const MAX_QUANTITY = 99

function maxQuantityFor(item) {
  return Math.min(MAX_QUANTITY, item.stock ?? MAX_QUANTITY)
}

export function CartProvider({ children }) {
  // Se lee localStorage al abrir la página
  const [items, setItems] = useState(readCart)

  useEffect(() => {
    saveCart(items)
  }, [items])

  // Si el usuario tiene la tienda abierta en dos pestañas, los cambios en una se ven en la otra
  useEffect(() => {
    function handleStorage(event) {
      if (event.key === CART_KEY) setItems(readCart())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Si el producto ya está, suma 1
  const addItem = useCallback((product) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, maxQuantityFor(item)) }
            : item
        )
      }
      return [
        ...current,
        {
          id: product.id,
          title: product.title,
          priceJpy: product.priceJpy,
          imageUrl: product.imageUrl,
          stock: product.stock,
          quantity: 1
        }
      ]
    })
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    if (!Number.isInteger(quantity)) return
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, maxQuantityFor(item))) } : item
      )
    )
  }, [])

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const value = useMemo(() => {

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotalJpy = items.reduce((sum, item) => sum + item.priceJpy * item.quantity, 0)
    return { items, itemCount, subtotalJpy, addItem, updateQuantity, removeItem, clearCart }
  }, [items, addItem, updateQuantity, removeItem, clearCart])

  return <CartContext value={value}>{children}</CartContext>
}
