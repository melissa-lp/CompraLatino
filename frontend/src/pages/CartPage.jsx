import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth.js'
import { useCart } from '../cart/useCart.js'
import './CartPage.css'

const yenFormatter = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

export function CartPage() {
  const { user } = useAuth()
  const { items, itemCount, subtotalJpy, updateQuantity, removeItem, clearCart } = useCart()
  const navigate = useNavigate()

  function handleCheckout() {
    if (user) {
      navigate('/checkout')
    } else {
      navigate('/login', { state: { from: '/carrito' } })
    }
  }

  function handleClear() {
    if (window.confirm('¿Quitar todos los productos del carrito?')) clearCart()
  }

  if (items.length === 0) {
    return (
      <section className="page cart">
        <h1>Carrito</h1>
        <p className="page-status">Tu carrito está vacío.</p>
        <Link to="/productos" className="button cart__link-button">Ver productos</Link>
      </section>
    )
  }

  return (
    <section className="page cart">
      <h1>Carrito</h1>

      <div className="cart__layout">
        <ul className="cart__items">
          {items.map((item) => (
            <li key={item.id} className="cart__item">
              <img className="cart__image" src={item.imageUrl} alt="" />

              <div className="cart__details">
                <h2 className="cart__title">{item.title}</h2>
                <p className="cart__unit-price">{yenFormatter.format(item.priceJpy)} c/u</p>
                <button type="button" className="cart__remove" onClick={() => removeItem(item.id)}>
                  Quitar
                </button>
              </div>

              <div className="cart__quantity" aria-label={`Cantidad de ${item.title}`}>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  aria-label="Quitar una unidad"
                >
                  −
                </button>
                <span aria-live="polite">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  // El provider tampoco deja pasar del stock; aquí solo se desactiva el botón
                  disabled={item.stock !== undefined && item.quantity >= item.stock}
                  aria-label="Agregar una unidad"
                >
                  +
                </button>
              </div>

              <p className="cart__line-total">{yenFormatter.format(item.priceJpy * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <aside className="cart__summary">
          <h2>Resumen</h2>
          <div className="cart__summary-row">
            <span>Productos ({itemCount})</span>
            <span>{yenFormatter.format(subtotalJpy)}</span>
          </div>
          <p className="cart__note">
            Precios al momento de agregar los productos. El total en dólares (tipo de cambio y cargo por
            servicio) se confirma al finalizar la compra.
          </p>
          <button type="button" className="button cart__checkout" onClick={handleCheckout}>
            {user ? 'Continuar con la compra' : 'Inicia sesión para comprar'}
          </button>
          <button type="button" className="cart__clear" onClick={handleClear}>
            Vaciar carrito
          </button>
        </aside>
      </div>
    </section>
  )
}
