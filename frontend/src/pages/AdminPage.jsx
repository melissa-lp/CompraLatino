import { useState, useEffect } from 'react';
import './AdminDashboard.css';

export function AdminPage() {
  const [metrics, setMetrics] = useState({
    total_products: 0,
    total_items_stock: 0,
    total_inventory_value_jpy: 0,
    active_categories: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3002/api/admin/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar métricas:', err);
        setLoading(false);
      });
  }, []);

  return (
    <section className="page admin-page">
      <header className="admin-header">
        <h1>Dashboard</h1>
        <p>Métricas del catálogo de CompraLatino.</p>
      </header>

      {loading ? (
        <div className="loading-state">Calculando métricas...</div>
      ) : (
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Total de Productos</h3>
            <p className="metric-value">{metrics.total_products}</p>
          </div>
          <div className="metric-card">
            <h3>Categorías Activas</h3>
            <p className="metric-value">{metrics.active_categories}</p>
          </div>
          <div className="metric-card">
            <h3>Unidades en Stock</h3>
            <p className="metric-value">{metrics.total_items_stock}</p>
          </div>
          <div className="metric-card highlight">
            <h3>Valor del Inventario</h3>
            <p className="metric-value">¥ {metrics.total_inventory_value_jpy.toLocaleString('ja-JP')}</p>
          </div>
        </div>
      )}
      
      <div className="admin-table-container">
         <h3>Módulo de Recomendaciones y Reportes</h3>
         <p>PLACEHOLDER PARA RECOMENDACIONES Y REPORTES.</p>
         <p style={{ fontSize: '0.85rem', marginTop: '1rem', color: '#9ca3af' }}>
          
         </p>
      </div>
    </section>
  );
}