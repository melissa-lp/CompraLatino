import { useAuth } from '../auth/useAuth.js'

// Panel de administración
export function AdminPage() {
  const { user } = useAuth()

  return (
    <section className="page">
      <h1>Panel de administración</h1>
      <p>Bienvenida/o, {user.fullName}.</p>
      <p className="page-status">Próximamente: gestión de productos.</p>
    </section>
  )
}
