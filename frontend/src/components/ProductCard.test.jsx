// TC-UI-12 Seguridad HTML: el nombre con etiquetas se ve como texto
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductCard } from './ProductCard.jsx'
import { useCart } from '../cart/useCart.js'
import { usePricing } from '../catalog/usePricing.js'

vi.mock('../cart/useCart.js', () => ({ useCart: vi.fn() }))
vi.mock('../catalog/usePricing.js', () => ({ usePricing: vi.fn() }))

const product = {
  id: 'p1',
  title: '<img src=x onerror=alert(1)> Cámara',
  categoryName: 'Cámaras',
  priceJpy: 5000,
  stock: 3,
  imageUrl: '',
  condition: 'new',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useCart).mockReturnValue({ addItem: vi.fn() })
  vi.mocked(usePricing).mockReturnValue(null)
})

describe('TC-UI-12 Seguridad HTML', () => {
  it('muestra las etiquetas como texto sin ejecutarlas', () => {
    const { container } = render(<ProductCard product={product} />)

    expect(screen.getByText(product.title)).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('[onerror]')).toBeNull()
  })

  it('agrega al carrito con el botón', async () => {
    const actor = userEvent.setup()
    const addItem = vi.fn()
    vi.mocked(useCart).mockReturnValue({ addItem })
    render(<ProductCard product={product} />)

    await actor.click(screen.getByRole('button', { name: /agregar al carrito/i }))

    expect(addItem).toHaveBeenCalledWith(product)
    expect(screen.getByRole('button', { name: /agregado/i })).toBeInTheDocument()
  })
})
