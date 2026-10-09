import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { formatDate, formatUsd, ORDER_STATUS_LABELS } from '../utils/format.js'
import './Orders.css'

// Historial de compras
export function OrdersPage() {
  const { token } = useAuth()
  const [result, setResult] = useState({ loaded: false, orders: [], error: '' })

  useEffect(() => {
    let cancelled = false
    apiFetch('/orders', { token })
      .then((orders) => {
        if (!cancelled) setResult({ loaded: true, orders, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setResult({ loaded: true, orders: [], error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const { loaded, orders, error } = result

  return (
    <section className="page orders">
      <h1>Mis pedidos</h1>

      {!loaded && <p className="page-status">Cargando pedidos…</p>}
      {error && <p className="orders__error" role="alert">{error}</p>}
      {loaded && !error && orders.length === 0 && (
        <>
          <p className="page-status">Todavía no tienes pedidos.</p>
          <Link to="/productos" className="button orders__link-button">Ver productos</Link>
        </>
      )}

      {orders.length > 0 && (
        <ul className="orders__list">
          {orders.map((order) => (
            <li key={order.id}>
              <Link to={`/pedidos/${order.id}`} className="orders__list-item">
                <span>
                  <strong>{formatDate(order.createdAt)}</strong>
                  <span className="page-status"> · {order.unitCount} {order.unitCount === 1 ? 'producto' : 'productos'}</span>
                </span>
                <span className={`orders__status orders__status--${order.status}`}>{ORDER_STATUS_LABELS[order.status]}</span>
                <strong>{formatUsd(order.totalUsd)}</strong>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
