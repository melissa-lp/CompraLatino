import { useState, useEffect } from 'react';
import './ProductsPage.css';

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); 

  const fetchProducts = (query = '') => {
    setLoading(true);
    fetch(`http://localhost:3002/api/products?q=${query}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar productos:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    const cartItem = {
      id: product.id,
      title: product.title,
      price_jpy: product.price_jpy,
      image_url: product.image_url,
      quantity: 1
    };
    
    const currentCart = JSON.parse(localStorage.getItem('compraLatino_cart')) || [];
    localStorage.setItem('compraLatino_cart', JSON.stringify([...currentCart, cartItem]));
    
    alert(`${product.title} listo para comprar (PLACEHOLDER)`);
  };

  return (
    <section className="page products-page">
      <header className="products-header">
        <h1>Catálogo de Productos</h1>
        <p>Artículos importados a través de YAuctions.</p>
        
        <div className="search-form">
          <input 
            type="text" 
            placeholder="Buscar por nombre o categoría" 
            value={searchTerm}
            onChange={(e) => {
              const valor = e.target.value;
              setSearchTerm(valor);
              fetchProducts(valor); 
            }}
            className="search-input"
          />
        </div>
      </header>

      {loading ? (
        <div className="loading-state">Actualizando catálogo...</div>
      ) : (
        <div className="products-grid">
          {products.length > 0 ? (
            products.map(product => (
              <article key={product.id} className="product-card">
                <div className="product-image-container">
                  <img src={product.image_url} alt={product.title} />
                  <span className="product-condition">
                    {product.condition === 'new' ? 'Nuevo' : 'Usado'}
                  </span>
                </div>
                <div className="product-info">
                  <span className="product-category">{product.category_name}</span>
                  <h2 className="product-title">{product.title}</h2>
                  <p className="product-price">¥ {product.price_jpy.toLocaleString('ja-JP')}</p>
                  <p className="product-stock">Disponible: {product.stock} uds.</p>
                  
                  <button className="btn-add-cart" onClick={() => handleAddToCart(product)}>
                    Agregar al carrito
                  </button>
                  
                </div>
              </article>
            ))
          ) : (
            <div className="no-results">
              <h3>No se encontraron productos</h3>
              <p>Intenta con otra palabra.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}