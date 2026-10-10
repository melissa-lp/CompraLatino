import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { useCart } from '../cart/useCart.js'
import { formatJpy, formatUsd } from '../utils/format.js'
import './Orders.css'

export function CheckoutPage() {
  const { user, token } = useAuth()
  const { items, clearCart } = useCart()
  const navigate = useNavigate()

  const [shipping, setShipping] = useState({
    fullName: user.fullName,
    phone: '',
    country: 'El Salvador',
    city: '',
    address: ''
  })
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const orderItems = items.map((item) => ({ productId: item.id, quantity: item.quantity }))
  const cartKey = JSON.stringify(orderItems)

  // Resultado de la última cotización
  const [quoteResult, setQuoteResult] = useState({ cartKey: null, quote: null, error: '' })
  const isQuoting = quoteResult.cartKey !== cartKey
  const { quote, error: quoteError } = quoteResult

  useEffect(() => {
    if (items.length === 0) return
    let cancelled = false
    apiFetch('/orders/quote', { method: 'POST', body: { items: JSON.parse(cartKey) }, token })
      .then((data) => {
        if (!cancelled) setQuoteResult({ cartKey, quote: data, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setQuoteResult({ cartKey, quote: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [cartKey, items.length, token])

  function updateField(event) {
    const { name, value } = event.target
    setShipping((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const order = await apiFetch('/orders', { method: 'POST', body: { items: orderItems, shipping }, token })
      clearCart()
      navigate(`/pedidos/${order.id}`, { replace: true, state: { justCreated: true } })
    } catch (err) {
      setSubmitError(err.message)
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <section className="page orders">
        <h1>Finalizar compra</h1>
        <p className="page-status">Tu carrito está vacío.</p>
        <Link to="/productos" className="button orders__link-button">Ver productos</Link>
      </section>
    )
  }

  // Precio guardado en el carrito
  const cartPrices = Object.fromEntries(items.map((item) => [item.id, item.priceJpy]))

  return (
    <section className="page orders">
      <h1>Finalizar compra</h1>

      <div className="orders__layout">
        <form className="orders__form" onSubmit={handleSubmit}>
          <h2>Dirección de envío</h2>
          <label>
            Nombre de quien recibe
            <input name="fullName" required maxLength={120} autoComplete="name" value={shipping.fullName} onChange={updateField} />
          </label>
          <label>
            Teléfono
            <input name="phone" type="tel" required maxLength={30} autoComplete="tel" placeholder="+503 7000-0000" value={shipping.phone} onChange={updateField} />
          </label>
          <div className="orders__form-row">
            <label>
              País
              <input name="country" required maxLength={60} autoComplete="country-name" value={shipping.country} onChange={updateField} />
            </label>
            <label>
              Ciudad
              <input name="city" required maxLength={80} autoComplete="address-level2" value={shipping.city} onChange={updateField} />
            </label>
          </div>
          <label>
            Dirección
            <textarea name="address" required rows={3} maxLength={250} autoComplete="street-address" value={shipping.address} onChange={updateField} />
          </label>

          {submitError && <p className="orders__error" role="alert">{submitError}</p>}

          <button type="submit" className="button" disabled={isSubmitting || isQuoting || !quote}>
            {isSubmitting ? 'Comprando en YAuctions…' : quote ? `Confirmar compra · ${formatUsd(quote.totalUsd)}` : 'Confirmar compra'}
          </button>
        </form>

        <aside className="orders__summary">
          <h2>Resumen</h2>

          {isQuoting && <p className="page-status">Calculando precios actuales…</p>}

          {!isQuoting && quoteError && (
            <>
              <p className="orders__error" role="alert">{quoteError}</p>
              <Link to="/carrito">Volver al carrito</Link>
            </>
          )}

          {!isQuoting && quote && (
            <>
              <ul className="orders__lines">
                {quote.lines.map((line) => (
                  <li key={line.productId}>
                    <span>
                      {line.title} × {line.quantity}
                      {cartPrices[line.productId] !== line.unitPriceJpy && (
                        <small className="orders__price-changed"> (el precio cambió)</small>
                      )}
                    </span>
                    <span>{formatJpy(line.lineTotalJpy)}</span>
                  </li>
                ))}
              </ul>
              <dl className="orders__totals">
                <div><dt>Subtotal</dt><dd>{formatJpy(quote.subtotalJpy)}</dd></div>
                <div><dt>Tipo de cambio</dt><dd>1 US$ = {(1 / quote.exchangeRate).toFixed(2)} ¥</dd></div>
                <div><dt>Subtotal en dólares</dt><dd>{formatUsd(quote.subtotalUsd)}</dd></div>
                <div><dt>Cargo por servicio</dt><dd>{formatUsd(quote.serviceFeeUsd)}</dd></div>
                <div className="orders__total"><dt>Total</dt><dd>{formatUsd(quote.totalUsd)}</dd></div>
              </dl>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
