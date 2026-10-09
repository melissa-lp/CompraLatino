import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth.js'

// Muestra la página solo si hay sesión
export function ProtectedRoute({ role, children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <p className="page-status">Cargando…</p>
  }

  if (!user) {
    // Recuerda a dónde quería ir, para volver  después del login
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (role && user.role !== role) {
    return (
      <section className="page">
        <h1>Acceso restringido</h1>
        <p>No tienes permiso para ver esta página.</p>
      </section>
    )
  }

  
  return children ?? <Outlet />
}
