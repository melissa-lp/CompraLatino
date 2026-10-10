import { Link } from 'react-router'
import './Footer.css'

// Se calcula una vez al cargar la app
const CURRENT_YEAR = new Date().getFullYear()

// Footer
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__content">
        <div className="footer__brand">
          <p className="footer__logo">CompraLatino</p>
          <p>Productos de Japón, en la puerta de tu casa.</p>
        </div>

        <nav aria-label="Explora">
          <h2>Explora</h2>
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/productos">Productos</Link></li>
            <li><Link to="/quienes-somos">Quiénes somos</Link></li>
          </ul>
        </nav>

        <nav aria-label="Mi cuenta">
          <h2>Mi cuenta</h2>
          <ul>
            <li><Link to="/pedidos">Mis pedidos</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
          </ul>
        </nav>

        <nav aria-label="Soporte">
          <h2>Soporte</h2>
          <ul>
            <li><a href="mailto:soporte@compralatino.com">Contáctanos</a></li>
            <li><Link to="/privacidad">Privacidad</Link></li>
          </ul>
        </nav>

        <div>
          <h2>Redes sociales</h2>
          <ul className="footer__muted">
            <li>Facebook</li>
            <li>Instagram</li>
            <li>TikTok</li>
          </ul>
        </div>
      </div>

      <p className="footer__bottom">
        © {CURRENT_YEAR} CompraLatino · Universidad Don Bosco
      </p>
    </footer>
  )
}
