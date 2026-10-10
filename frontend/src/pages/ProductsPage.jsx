import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { apiFetch } from '../api/client.js'
import { useCategories } from '../catalog/useCategories.js'
import { Breadcrumb } from '../components/Breadcrumb.jsx'
import { ProductCard } from '../components/ProductCard.jsx'
import './ProductsPage.css'

const SEARCH_DELAY_MS = 300

const SORT_LABELS = {
  newest: 'Más recientes',
  oldest: 'Más antiguos',
  price_asc: 'Precio: menor a mayor',
  price_desc: 'Precio: mayor a menor'
}
const DEFAULT_SORT = 'newest'

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categorySlug = searchParams.get('categoria') ?? ''
  const sort = Object.hasOwn(SORT_LABELS, searchParams.get('orden')) ? searchParams.get('orden') : DEFAULT_SORT

  const { categories } = useCategories()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const category = categories.find((c) => c.slug === categorySlug)

  useEffect(() => {
    let cancelled = false
    const delay = searchTerm === '' ? 0 : SEARCH_DELAY_MS

    const timer = setTimeout(() => {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({ q: searchTerm, sort })
      if (categorySlug) params.set('category', categorySlug)
      apiFetch(`/products?${params}`)
        .then((data) => {
          if (!cancelled) setProducts(data)
        })
        .catch((err) => {
          if (!cancelled) setError(err.message)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, delay)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchTerm, categorySlug, sort])

  function updateFilter(name, value, defaultValue = '') {
    const next = new URLSearchParams(searchParams)
    if (value === defaultValue) next.delete(name)
    else next.set(name, value)
    setSearchParams(next, { replace: true })
  }

  return (
    <section className="page products-page">
      <Breadcrumb
        items={[
          { label: 'Inicio', to: '/' },
          { label: 'Productos', to: '/productos' },
          ...(category ? [{ label: category.name, to: `/productos?categoria=${category.slug}` }] : [])
        ]}
      />

      <header className="products-header">
        <h1>{category ? category.name : 'Todos los productos'}</h1>
        <p>Artículos importados a través de YAuctions.</p>
      </header>

      <div className="filters" role="search">
        <input
          type="search"
          placeholder="Buscar por nombre"
          aria-label="Buscar productos"
          maxLength={100}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input filters__search"
        />

        <label className="filters__field">
          <span>Categoría</span>
          <select value={categorySlug} onChange={(e) => updateFilter('categoria', e.target.value)}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name} ({c.productCount})</option>
            ))}
          </select>
        </label>

        <label className="filters__field">
          <span>Ordenar por</span>
          <select value={sort} onChange={(e) => updateFilter('orden', e.target.value, DEFAULT_SORT)}>
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      <p className="filters__count" aria-live="polite">
        {!loading && !error && `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`}
      </p>

      {error && <p className="products-error" role="alert">{error}</p>}

      {loading && products.length === 0 && <div className="loading-state">Actualizando catálogo...</div>}

      {!loading && !error && products.length === 0 && (
        <div className="no-results">
          <h3>No se encontraron productos</h3>
          <p>Prueba con otra palabra o con otra categoría.</p>
        </div>
      )}

      {products.length > 0 && (
        <div className={`products-grid ${loading ? 'is-refreshing' : ''}`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
