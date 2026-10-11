import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { ProductCard } from './ProductCard.jsx'

export function RecommendedProducts() {
    const { token, isLoading } = useAuth()

    const [result, setResult] = useState({
        products: [],
        loading: true,
        error: '',
        personalized: false
    })

    useEffect(() => {
        if (isLoading) return

        let cancelled = false

        async function loadRecommendations() {
            setResult({
                products: [],
                loading: true,
                error: '',
                personalized: false
            })

            try {
                let products = []
                let personalized = false

                // Intentar recomendaciones personalizadas si hay sesión
                if (token) {
                    try {
                        const response = await apiFetch(
                            '/recommendations/me',
                            { token }
                        )

                        if (response.products.length > 0) {
                            products = response.products
                            personalized = true
                        }
                    } catch (error) {
                        console.warn(
                            'No se pudieron cargar recomendaciones personalizadas:',
                            error.message
                        )
                    }
                }

                // Alternativa para visitantes y usuarios sin recomendaciones
                if (products.length === 0) {
                    const catalog = await apiFetch(
                        '/products?sort=newest&limit=20'
                    )

                    products = catalog
                        .filter((product) => product.stock > 0)
                        .slice(0, 4)
                }

                if (!cancelled) {
                    setResult({
                        products,
                        loading: false,
                        error: '',
                        personalized
                    })
                }
            } catch (error) {
                if (!cancelled) {
                    setResult({
                        products: [],
                        loading: false,
                        error: error.message,
                        personalized: false
                    })
                }
            }
        }

        loadRecommendations()

        return () => {
            cancelled = true
        }
    }, [token, isLoading])

    if (result.loading || isLoading) {
        return (
            <p className="page-status">
                Cargando recomendaciones...
            </p>
        )
    }

    if (result.error) {
        return (
            <p className="page-status" role="alert">
                No se pudieron cargar las recomendaciones: {result.error}
            </p>
        )
    }

    if (result.products.length === 0) {
        return (
            <p className="page-status">
                No hay recomendaciones disponibles por el momento.
            </p>
        )
    }

    return (
        <>
            <p className="page-status">
                {result.personalized
                    ? 'Productos seleccionados según tus compras anteriores.'
                    : 'Descubre algunos productos disponibles en CompraLatino.'}
            </p>

            <div className="products-grid products-grid--featured">
                {result.products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                    />
                ))}
            </div>
        </>
    )
}