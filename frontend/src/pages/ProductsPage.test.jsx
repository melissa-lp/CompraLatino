// TC-UI-04 Catálogo: búsqueda, filtros, categorías y ordenamiento
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductsPage } from './ProductsPage.jsx'
import { apiFetch } from '../api/client.js'
import { useCategories } from '../catalog/useCategories.js'
import { useCart } from '../cart/useCart.js'
import { usePricing } from '../catalog/usePricing.js'

vi.mock('../api/client.js', () => ({ apiFetch: vi.fn() }))
vi.mock('../catalog/useCategories.js', () => ({ useCategories: vi.fn() }))
vi.mock('../cart/useCart.js', () => ({ useCart: vi.fn() }))
vi.mock('../catalog/usePricing.js', () => ({ usePricing: vi.fn() }))

const products = [
  { id: 'p1', title: 'Cámara Sony', categoryName: 'Cámaras', priceJpy: 50000, stock: 3, imageUrl: '', condition: 'new' },
  { id: 'p2', title: 'Figura Goku', categoryName: 'Figuras', priceJpy: 3000, stock: 10, imageUrl: '', condition: 'new' },
]

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/productos']}>
      <ProductsPage />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(apiFetch).mockResolvedValue(products)
  vi.mocked(useCategories).mockReturnValue({
    categories: [{ slug: 'figuras', name: 'Figuras', productCount: 5 }],
    isLoading: false,
    error: '',
  })
  vi.mocked(useCart).mockReturnValue({ addItem: vi.fn() })
  vi.mocked(usePricing).mockReturnValue(null)
})

describe('TC-UI-04 Catálogo', () => {
  it('muestra los productos', async () => {
    renderPage()

    expect(await screen.findByText('Cámara Sony')).toBeInTheDocument()
    expect(screen.getByText('Figura Goku')).toBeInTheDocument()
    expect(screen.getByText('2 productos')).toBeInTheDocument()
  })

  it('la búsqueda filtra por nombre', async () => {
    const actor = userEvent.setup()
    renderPage()
    await screen.findByText('Cámara Sony')

    await actor.type(screen.getByLabelText(/buscar productos/i), 'camara')

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/products?q=camara&sort=newest')
    })
  })

  it('la categoría y el orden cambian la consulta', async () => {
    const actor = userEvent.setup()
    renderPage()
    await screen.findByText('Cámara Sony')

    await actor.selectOptions(screen.getByLabelText(/categoría/i), 'figuras')
    await actor.selectOptions(screen.getByLabelText(/ordenar por/i), 'price_asc')

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('category=figuras'))
    })
    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(expect.stringContaining('sort=price_asc'))
    })
  })
})
