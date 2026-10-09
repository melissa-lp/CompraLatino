import { Link, NavLink } from 'react-router'
import { useAuth } from '../auth/useAuth.js'
import { useCart } from '../cart/useCart.js'
import './Header.css'

export function Header() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()

  return (
    <header className="header">
      <Link to="/" className="header__brand">
        <img src="/favicon.svg" alt="" width="28" height="28" />
        CompraLatino
      </Link>

      <nav className="header__nav" aria-label="Principal">
        <NavLink to="/" end>Inicio</NavLink>
        <NavLink to="/productos">Productos</NavLink>
        <NavLink to="/quienes-somos">Quiénes somos</NavLink>
        {user && <NavLink to="/pedidos">Mis pedidos</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
      </nav>

      <div className="header__actions">
        {user ? (
          <>
            <span className="header__greeting">Hola, {user.fullName.split(' ')[0]}</span>
            <button type="button" className="header__logout" onClick={logout}>
              Salir
            </button>
          </>
        ) : (
          <Link to="/login" className="header__icon" aria-label="Iniciar sesión">
            <UserIcon />
          </Link>
        )}
        <Link to="/carrito" className="header__icon header__cart" aria-label={`Carrito (${itemCount} productos)`}>
          <CartIcon />
          {/* Contador */}
          {itemCount > 0 && <span className="header__badge">{itemCount > 99 ? '99+' : itemCount}</span>}
        </Link>
      </div>
    </header>
  )
}

function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.2 18.4a7 7 0 0 1 11.6 0" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </svg>
  )
}
