import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import './AdminDashboard.css'

const yenFormatter = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

export function AdminPage() {
  const { token } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState('')

  // Las rutas /admin/... exigen el token de un admin
  const loadMetrics = useCallback(() => {
    return apiFetch('/admin/catalog/metrics', { token })
      .then(setMetrics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    loadMetrics()
  }, [loadMetrics])

  async function handleSync() {
    setIsSyncing(true)
    setSyncResult('')
    setError('')
    try {
      const summary = await apiFetch('/admin/catalog/sync', { method: 'POST', token })
      setSyncResult(
        `Sincronización completa: ${summary.created} nuevos, ${summary.updated} actualizados, ` +
          `${summary.deactivated} desactivados.` +
          (summary.skipped.length > 0 ? ` Omitidos: ${summary.skipped.join(', ')}` : '')
      )
      // Actualización de métricas
      await loadMetrics()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <section className="page admin-page">
      <header className="admin-header">
        <h1>Dashboard</h1>
        <p>Métricas del catálogo de CompraLatino.</p>
      </header>

      <div className="admin-actions">
        <button type="button" className="button" onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? 'Sincronizando…' : 'Sincronizar con YAuctions'}
        </button>
        {syncResult && <p className="admin-status" role="status">{syncResult}</p>}
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}

      {loading ? (
        <div className="loading-state">Calculando métricas...</div>
      ) : (
        metrics && (
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total de Productos</h3>
              <p className="metric-value">{metrics.totalProducts}</p>
            </div>
            <div className="metric-card">
              <h3>Categorías Activas</h3>
              <p className="metric-value">{metrics.activeCategories}</p>
            </div>
            <div className="metric-card">
              <h3>Unidades en Stock</h3>
              <p className="metric-value">{metrics.totalItemsStock}</p>
            </div>
            <div className="metric-card highlight">
              <h3>Valor del Inventario</h3>
              <p className="metric-value">{yenFormatter.format(metrics.totalInventoryValueJpy)}</p>
            </div>
          </div>
        )
      )}

    </section>
  )
}
