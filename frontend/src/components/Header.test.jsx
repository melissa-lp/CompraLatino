// TC-UI-02 Cierre de sesión desde el encabezado
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header.jsx'
import { useAuth } from '../auth/useAuth.js'
import { useCart } from '../cart/useCart.js'

vi.mock('../auth/useAuth.js', () => ({ useAuth: vi.fn() }))
vi.mock('../cart/useCart.js', () => ({ useCart: vi.fn() }))

function renderHeader(auth) {
  vi.mocked(useAuth).mockReturnValue(auth)
  vi.mocked(useCart).mockReturnValue({ itemCount: 0 })
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TC-UI-02 Cierre de sesión', () => {
  it('muestra el nombre y cierra sesión al pulsar Salir', async () => {
    const actor = userEvent.setup()
    const logout = vi.fn()
    renderHeader({ user: { fullName: 'Ronald', role: 'customer' }, logout })

    expect(screen.getByText('Hola, Ronald')).toBeInTheDocument()
    await actor.click(screen.getByRole('button', { name: /salir/i }))

    expect(logout).toHaveBeenCalled()
  })

  it('sin sesión ofrece iniciar sesión', () => {
    renderHeader({ user: null, logout: vi.fn() })

    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeInTheDocument()
    expect(screen.queryByText(/mis pedidos/i)).not.toBeInTheDocument()
  })
})
