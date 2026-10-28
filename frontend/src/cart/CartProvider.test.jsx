// TC-UI-05 Carrito: agregar, modificar, eliminar, totales y persistencia
import { act } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { CartProvider } from './CartProvider.jsx'
import { useCart } from './useCart.js'
import { CART_KEY } from './cartStorage.js'

const product = { id: 'p1', title: 'Cámara', priceJpy: 5000, imageUrl: '', stock: 10 }

let cart
function Capture() {
  cart = useCart()
  return null
}

function renderCart() {
  return render(
    <CartProvider>
      <Capture />
    </CartProvider>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('TC-UI-05 Carrito', () => {
  it('agrega productos y calcula cantidades y totales', () => {
    renderCart()

    act(() => {
      cart.addItem(product)
      cart.addItem(product)
    })

    expect(cart.itemCount).toBe(2)
    expect(cart.subtotalJpy).toBe(10000)
  })

  it('modifica cantidades y elimina productos', () => {
    renderCart()

    act(() => cart.addItem(product))
    act(() => cart.updateQuantity('p1', 3))
    expect(cart.itemCount).toBe(3)

    act(() => cart.removeItem('p1'))
    expect(cart.items).toHaveLength(0)
    expect(cart.subtotalJpy).toBe(0)
  })

  it('persiste entre recargas', () => {
    const first = renderCart()
    act(() => cart.addItem(product))

    const saved = JSON.parse(localStorage.getItem(CART_KEY))
    expect(saved).toHaveLength(1)

    first.unmount()
    renderCart()
    expect(cart.itemCount).toBe(1)
    expect(cart.items[0].title).toBe('Cámara')
  })
})
