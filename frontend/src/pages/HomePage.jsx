import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiFetch } from '../api/client.js'
import { ProductCard } from '../components/ProductCard.jsx'
import './HomePage.css'

const FEATURED_COUNT = 4

const STEPS = [
  { title: 'Elige', text: 'Explora productos de YAuctions (Japón) con su precio en yenes.' },
  { title: 'Paga en dólares', text: 'Antes de confirmar ves el total con tipo de cambio y cargo por servicio.' },
  { title: 'Compramos por ti', text: 'Realizamos la compra en Japón y te damos el número de confirmación.' },
  { title: 'Recibe en casa', text: 'Sigue el estado de tu pedido hasta que llegue a tu puerta.' }
]

// Testimonios
const TESTIMONIALS = [
  { name: 'Carlos M.', city: 'San Salvador', text: 'Recibí mi pedido de Japón en menos de 3 semanas, todo el proceso fue muy claro.' },
  { name: 'Leslie P.', city: 'Santa Ana', text: 'Fue muy fácil encontrar el producto que buscaba y llegó hasta la puerta de mi casa.' },
  { name: 'Andrea R.', city: 'Ciudad de Guatemala', text: 'Conseguí un reloj de edición especial que no encontraba en ningún otro lado.' }
]

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero__content">
          <h1>CompraLatino</h1>
          <p>
            Te conectamos con miles de productos japoneses de YAuctions y gestionamos tu compra de principio a fin.
          </p>
          <div className="hero__actions">
            <Link to="/productos" className="hero__button hero__button--primary">Ver productos</Link>
            <Link to="/quienes-somos" className="hero__button hero__button--secondary">Quiénes somos</Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section__header">
          <h2>Productos destacados</h2>
          <Link to="/productos" className="button home-section__link">Ver todos</Link>
        </div>
        <FeaturedProducts />
      </section>

      <section className="home-section">
        <h2>Cómo funciona</h2>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="steps__item">
              <span className="steps__number" aria-hidden="true">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section">
        <h2>Testimonios</h2>
        <p className="page-status">Lo que dicen nuestros clientes</p>
        <ul className="testimonials">
          {TESTIMONIALS.map((testimonial) => (
            <li key={testimonial.name} className="testimonial">
              <p className="testimonial__text">«{testimonial.text}»</p>
              <p className="testimonial__author">
                <strong>{testimonial.name}</strong>
                <span>{testimonial.city}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function FeaturedProducts() {
  const [result, setResult] = useState({ products: [], loaded: false, error: '' })

  useEffect(() => {
    let cancelled = false
    apiFetch(`/products?sort=newest&limit=${FEATURED_COUNT}`)
      .then((products) => {
        if (!cancelled) setResult({ products, loaded: true, error: '' })
      })
      .catch((err) => {
        if (!cancelled) setResult({ products: [], loaded: true, error: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const { products, loaded, error } = result
  if (!loaded) return <p className="page-status">Cargando productos…</p>
  if (error) return <p className="page-status" role="alert">No se pudieron cargar los productos: {error}</p>
  if (products.length === 0) return <p className="page-status">Pronto tendremos productos disponibles.</p>

  return (
    <div className="products-grid products-grid--featured">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
