import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { formatDate, formatJpy, formatUsd, ORDER_STATUS_LABELS } from '../utils/format.js'
import './Orders.css'

// Detalle de una orden del usuario
export function OrderPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const location = useLocation()
  const justCreated = location.state?.justCreated

  // Resultado guardado junto con el id al que corresponde
  const [result, setResult] = useState({ id: null, order: null, error: '' })
  const isLoading = result.id !== id
  const { order, error } = result

  useEffect(() => {
    let cancelled = false
    apiFetch(`/orders/${id}`, { token })
      .then((data) => {
        if (!cancelled) setResult({ id, order: data, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setResult({ id, order: null, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [id, token])

  if (isLoading) return <p className="page page-status">Cargando pedido…</p>
  if (error) {
    return (
      <section className="page orders">
        <h1>Pedido</h1>
        <p className="orders__error" role="alert">{error}</p>
        <Link to="/pedidos">Ver mis pedidos</Link>
      </section>
    )
  }

  return (
    <section className="page orders">
      {justCreated && order.status === 'purchased' && (
        <p className="orders__success" role="status">¡Gracias por tu compra! Ya la realizamos en YAuctions.</p>
      )}

      <header className="orders__header">
        <h1>Pedido</h1>
        <span className={`orders__status orders__status--${order.status}`}>{ORDER_STATUS_LABELS[order.status]}</span>
      </header>
      <p className="page-status">
        {formatDate(order.createdAt)} · N.º {order.id.slice(0, 8)}
        {order.yauctionsPurchaseId && ` · Compra YAuctions ${order.yauctionsPurchaseId}`}
      </p>

      <div className="orders__layout">
        <div>
          <h2>Productos</h2>
          <ul className="orders__lines">
            {order.items.map((item) => (
              <li key={item.productId}>
                <span>{item.title} × {item.quantity}</span>
                <span>{formatJpy(item.unitPriceJpy * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <h2>Seguimiento</h2>
          {/* Historial de estados */}
          <ol className="orders__timeline">
            {order.history.map((entry, index) => (
              <li key={index}>
                <strong>{ORDER_STATUS_LABELS[entry.status]}</strong> · {formatDate(entry.changedAt)}
                {entry.note && <div className="page-status">{entry.note}</div>}
              </li>
            ))}
          </ol>
        </div>

        <aside className="orders__summary">
          <h2>Total</h2>
          <dl className="orders__totals">
            <div><dt>Subtotal</dt><dd>{formatJpy(order.subtotalJpy)}</dd></div>
            <div><dt>Tipo de cambio</dt><dd>1 US$ = {(1 / order.exchangeRate).toFixed(2)} ¥</dd></div>
            <div><dt>Cargo por servicio</dt><dd>{formatUsd(order.serviceFeeUsd)}</dd></div>
            <div className="orders__total"><dt>Total</dt><dd>{formatUsd(order.totalUsd)}</dd></div>
          </dl>

          <h2>Envío</h2>
          <address className="orders__address">
            {order.shipping.fullName}<br />
            {order.shipping.address}<br />
            {order.shipping.city}, {order.shipping.country}<br />
            {order.shipping.phone}
          </address>
        </aside>
      </div>

      <Link to="/pedidos">← Ver todos mis pedidos</Link>
    </section>
  )
}
