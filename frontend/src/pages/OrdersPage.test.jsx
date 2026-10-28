// TC-UI-08 Historial de órdenes: lista de compras y detalle
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrdersPage } from './OrdersPage.jsx'
import { OrderPage } from './OrderPage.jsx'
import { apiFetch } from '../api/client.js'
import { useAuth } from '../auth/useAuth.js'

vi.mock('../api/client.js', () => ({ apiFetch: vi.fn() }))
vi.mock('../auth/useAuth.js', () => ({ useAuth: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ token: 't' })
})

describe('TC-UI-08 Historial de órdenes', () => {
  it('muestra las compras del usuario', async () => {
    vi.mocked(apiFetch).mockResolvedValue([
      { id: 'order-1', createdAt: '2026-10-20T12:00:00.000Z', status: 'purchased', unitCount: 2, totalUsd: 72.6 },
      { id: 'order-2', createdAt: '2026-10-21T12:00:00.000Z', status: 'delivered', unitCount: 1, totalUsd: 36.3 },
    ])
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('Comprado')).toBeInTheDocument()
    expect(screen.getByText('Entregado')).toBeInTheDocument()
    expect(screen.getByText('$72.60')).toBeInTheDocument()
  })

  it('avisa cuando no hay compras', async () => {
    vi.mocked(apiFetch).mockResolvedValue([])
    render(
      <MemoryRouter>
        <OrdersPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('Todavía no tienes pedidos.')).toBeInTheDocument()
  })

  it('muestra el detalle de una orden', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      id: 'order-1',
      status: 'purchased',
      createdAt: '2026-10-20T12:00:00.000Z',
      items: [{ productId: 'p1', title: 'Cámara', quantity: 1, unitPriceJpy: 5000 }],
      history: [{ status: 'purchased', changedAt: '2026-10-20T12:00:00.000Z' }],
      subtotalJpy: 5000,
      exchangeRate: 0.0066,
      serviceFeeUsd: 3.3,
      totalUsd: 36.3,
      shipping: {
        fullName: 'Ronald',
        address: 'Calle 1',
        city: 'San Salvador',
        country: 'El Salvador',
        phone: '70000000',
      },
    })
    render(
      <MemoryRouter initialEntries={[{ pathname: '/pedidos/order-1', state: { justCreated: true } }]}>
        <Routes>
          <Route path="/pedidos/:id" element={<OrderPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText(/gracias por tu compra/i)).toBeInTheDocument()
    expect(screen.getByText(/cámara × 1/i)).toBeInTheDocument()
    expect(screen.getByText(/ronald/i)).toBeInTheDocument()
  })
})
