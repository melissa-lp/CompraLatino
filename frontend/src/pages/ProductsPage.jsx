import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client.js'
import { addToCart } from '../cart/cartStorage.js'
import './ProductsPage.css'

const SEARCH_DELAY_MS = 300

const priceFormatter = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

export function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [addedProductId, setAddedProductId] = useState(null)

  useEffect(() => {
    let cancelled = false

    const timer = setTimeout(() => {
      setLoading(true)
      setError('')
      // encodeURIComponent: caracteres como & o # en la búsqueda no rompen la URL
      apiFetch(`/products?q=${encodeURIComponent(searchTerm)}`)
        .then((data) => {
          if (!cancelled) setProducts(data)
        })
        .catch((err) => {
          if (!cancelled) setError(err.message)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, SEARCH_DELAY_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchTerm])

  function handleAddToCart(product) {
    if (addToCart(product)) {
      setAddedProductId(product.id)
    } else {
      setError('No se pudo guardar el carrito en este navegador')
    }
  }

  return (
    <section className="page products-page">
      <header className="products-header">
        <h1>Catálogo de Productos</h1>
        <p>Artículos importados a través de YAuctions.</p>

        <div className="search-form">
          <input
            type="search"
            placeholder="Buscar por nombre o categoría"
            aria-label="Buscar productos"
            maxLength={100}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      {error && <p className="products-error" role="alert">{error}</p>}

      {loading && products.length === 0 && <div className="loading-state">Actualizando catálogo...</div>}

      {!loading && !error && products.length === 0 && (
        <div className="no-results">
          <h3>No se encontraron productos</h3>
          <p>Intenta con otra palabra.</p>
        </div>
      )}

      {products.length > 0 && (
        <div className={`products-grid ${loading ? 'is-refreshing' : ''}`}>
          {products.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-image-container">
                <img src={product.imageUrl} alt={product.title} loading="lazy" />
                <span className="product-condition">
                  {product.condition === 'new' ? 'Nuevo' : 'Usado'}
                </span>
              </div>
              <div className="product-info">
                <span className="product-category">{product.categoryName}</span>
                <h2 className="product-title">{product.title}</h2>
                <p className="product-price">{priceFormatter.format(product.priceJpy)}</p>
                <p className="product-stock">Disponible: {product.stock} uds.</p>

                <button
                  className="btn-add-cart"
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0
                    ? 'Agotado'
                    : addedProductId === product.id
                      ? 'Agregado ✓'
                      : 'Agregar al carrito'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
