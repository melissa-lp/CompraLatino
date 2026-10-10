import { useState } from 'react'
import { useCart } from '../cart/useCart.js'
import { usePricing } from '../catalog/usePricing.js'
import { formatJpy, formatUsd } from '../utils/format.js'
import './ProductCard.css'

export function ProductCard({ product }) {
  const { addItem } = useCart()
  const pricing = usePricing()
  const [added, setAdded] = useState(false)

  function handleAddToCart() {
    addItem(product)
    setAdded(true)
  }

  return (
    <article className="product-card">
      <div className="product-image-container">
        <img src={product.imageUrl} alt={product.title} loading="lazy" />
        <span className="product-condition">{product.condition === 'new' ? 'Nuevo' : 'Usado'}</span>
      </div>
      <div className="product-info">
        <span className="product-category">{product.categoryName}</span>
        <h2 className="product-title">{product.title}</h2>
        <p className="product-price">{formatJpy(product.priceJpy)}</p>
        {pricing && <p className="product-price-usd">≈ {formatUsd(product.priceJpy * pricing.exchangeRate)}</p>}
        <p className="product-stock">Disponible: {product.stock} uds.</p>

        <button className="btn-add-cart" onClick={handleAddToCart} disabled={product.stock === 0}>
          {product.stock === 0 ? 'Agotado' : added ? 'Agregado ✓' : 'Agregar al carrito'}
        </button>
      </div>
    </article>
  )
}
