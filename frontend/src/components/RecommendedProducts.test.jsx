// TC-UI-13 Recomendaciones: misma categoría comprada, sin repetir adquiridos
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecommendedProducts } from './RecommendedProducts.jsx'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { useCart } from '../cart/useCart.js'
import { usePricing } from '../catalog/usePricing.js'

vi.mock('../api/client.js', () => ({ apiFetch: vi.fn() }))
vi.mock('../auth/useAuth.js', () => ({ useAuth: vi.fn() }))
vi.mock('../cart/useCart.js', () => ({ useCart: vi.fn() }))
vi.mock('../catalog/usePricing.js', () => ({ usePricing: vi.fn() }))

const boughtTitle = 'Figura Naruto comprada'

function figure(id, title) {
  return { id, title, categoryName: 'Figuras', priceJpy: 3000, stock: 5, imageUrl: '', condition: 'new' }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useCart).mockReturnValue({ addItem: vi.fn() })
  vi.mocked(usePricing).mockReturnValue(null)
})

describe('TC-UI-13 Recomendaciones', () => {
  it('recomienda la categoría comprada sin repetir adquiridos', async () => {
    vi.mocked(useAuth).mockReturnValue({ token: 't', isLoading: false })
    vi.mocked(apiFetch).mockResolvedValue({ products: [figure('r1', 'Figura Goku'), figure('r2', 'Figura Luffy')] })

    render(<RecommendedProducts />)

    expect(await screen.findByText('Figura Goku')).toBeInTheDocument()
    expect(screen.getByText('Figura Luffy')).toBeInTheDocument()
    expect(screen.queryByText(boughtTitle)).not.toBeInTheDocument()
    expect(screen.getByText(/según tus compras/i)).toBeInTheDocument()
  })

  it('sin sesión muestra productos disponibles', async () => {
    vi.mocked(useAuth).mockReturnValue({ token: null, isLoading: false })
    vi.mocked(apiFetch).mockResolvedValue([figure('c1', 'Cámara general')])

    render(<RecommendedProducts />)

    expect(await screen.findByText('Cámara general')).toBeInTheDocument()
    expect(screen.queryByText(/según tus compras/i)).not.toBeInTheDocument()
  })
})
