// TC-UI-06 Checkout válido y TC-UI-07 Rechazo con dirección o teléfono inválidos
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CheckoutPage } from './CheckoutPage.jsx'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'
import { useCart } from '../cart/useCart.js'

vi.mock('../api/client.js', () => ({ apiFetch: vi.fn() }))
vi.mock('../auth/useAuth.js', () => ({ useAuth: vi.fn() }))
vi.mock('../cart/useCart.js', () => ({ useCart: vi.fn() }))

const items = [{ id: 'p1', title: 'Cámara', priceJpy: 5000, quantity: 2, stock: 5, imageUrl: '' }]
const quote = {
  lines: [{ productId: 'p1', title: 'Cámara', quantity: 2, unitPriceJpy: 5000, lineTotalJpy: 10000 }],
  subtotalJpy: 10000,
  exchangeRate: 0.0066,
  subtotalUsd: 66,
  serviceFeeUsd: 6.6,
  totalUsd: 72.6,
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/checkout']}>
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/pedidos/:id" element={<h1>Pedido confirmado</h1>} />
      </Routes>
    </MemoryRouter>
  )
}

async function fillShipping(actor, { phone, city, address }) {
  await actor.type(screen.getByLabelText(/teléfono/i), phone)
  await actor.type(screen.getByLabelText(/ciudad/i), city)
  await actor.type(screen.getByLabelText(/dirección/i), address)
}

async function waitForQuote() {
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeEnabled()
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ user: { fullName: 'Ronald' }, token: 't' })
  vi.mocked(useCart).mockReturnValue({ items, clearCart: vi.fn() })
})

describe('TC-UI-06 Checkout', () => {
  it('completa una compra válida y confirma la orden', async () => {
    const actor = userEvent.setup()
    const clearCart = vi.fn()
    vi.mocked(useCart).mockReturnValue({ items, clearCart })
    vi.mocked(apiFetch).mockImplementation((path) =>
      path === '/orders/quote' ? Promise.resolve(quote) : Promise.resolve({ id: 'order-1' })
    )
    renderPage()
    await waitForQuote()

    await fillShipping(actor, { phone: '+503 70000000', city: 'San Salvador', address: 'Calle 1' })
    await actor.click(screen.getByRole('button', { name: /confirmar/i }))

    expect(await screen.findByText('Pedido confirmado')).toBeInTheDocument()
    expect(clearCart).toHaveBeenCalled()
  })
})

describe('TC-UI-07 Validación del checkout', () => {
  it('rechaza la compra con teléfono inválido', async () => {
    const actor = userEvent.setup()
    const clearCart = vi.fn()
    vi.mocked(useCart).mockReturnValue({ items, clearCart })
    vi.mocked(apiFetch).mockImplementation((path) =>
      path === '/orders/quote'
        ? Promise.resolve(quote)
        : Promise.reject(new Error('Teléfono inválido. Usa un formato válido.'))
    )
    renderPage()
    await waitForQuote()

    await fillShipping(actor, { phone: 'abc', city: 'San Salvador', address: 'Calle 1' })
    await actor.click(screen.getByRole('button', { name: /confirmar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Teléfono inválido')
    expect(clearCart).not.toHaveBeenCalled()
    expect(screen.getByText('Finalizar compra')).toBeInTheDocument()
  })
})
