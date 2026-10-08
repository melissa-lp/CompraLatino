import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth.js'
import './AuthPage.css'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event) {
    // Evita que el navegador recargue la página al enviar el formulario
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      // El mensaje viene del servicio de identidad
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth">
      <h1>Iniciar sesión</h1>
      <p className="auth__subtitle">Accede para comprar y dar seguimiento a tus pedidos.</p>

      <form className="auth__form" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="auth__error" role="alert">{error}</p>}

        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="auth__switch">
        ¿No tienes cuenta? <Link to="/registro" state={location.state}>Crear cuenta</Link>
      </p>
    </section>
  )
}
