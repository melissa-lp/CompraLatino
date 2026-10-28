// TC-UI-03 Rutas protegidas y TC-UI-09 Permisos administrativos
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from './ProtectedRoute.jsx'
import { useAuth } from '../auth/useAuth.js'

vi.mock('../auth/useAuth.js', () => ({ useAuth: vi.fn() }))

function renderPrivate(auth, role) {
  vi.mocked(useAuth).mockReturnValue(auth)
  render(
    <MemoryRouter initialEntries={['/pedidos']}>
      <Routes>
        <Route element={<ProtectedRoute role={role} />}>
          <Route path="/pedidos" element={<h1>Contenido privado</h1>} />
        </Route>
        <Route path="/login" element={<h1>Página de login</h1>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TC-UI-03 Rutas protegidas', () => {
  it('sin sesión redirige al login', async () => {
    renderPrivate({ user: null, isLoading: false })

    expect(await screen.findByText('Página de login')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('con sesión muestra el contenido', () => {
    renderPrivate({ user: { email: 'ronald@test.com' }, isLoading: false })

    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })
})

describe('TC-UI-09 Permisos administrativos', () => {
  it('un cliente no entra al panel admin', () => {
    renderPrivate({ user: { email: 'ronald@test.com', role: 'customer' }, isLoading: false }, 'admin')

    expect(screen.getByText('Acceso restringido')).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('un admin sí entra', () => {
    renderPrivate({ user: { email: 'admin@test.com', role: 'admin' }, isLoading: false }, 'admin')

    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })
})
