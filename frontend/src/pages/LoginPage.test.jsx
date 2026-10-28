// TC-UI-02 Inicio de sesión: acceso y rechazo de credenciales incorrectas
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from './LoginPage.jsx'
import { useAuth } from '../auth/useAuth.js'

vi.mock('../auth/useAuth.js', () => ({ useAuth: vi.fn() }))

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<h1>Inicio</h1>} />
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ user: null, login: vi.fn() })
})

describe('TC-UI-02 Inicio de sesión', () => {
  it('entra y redirige con credenciales correctas', async () => {
    const actor = userEvent.setup()
    const login = vi.fn().mockResolvedValue({ email: 'ronald@test.com' })
    vi.mocked(useAuth).mockReturnValue({ user: null, login })
    renderPage()

    await actor.type(screen.getByLabelText(/correo electrónico/i), 'ronald@test.com')
    await actor.type(screen.getByLabelText(/contraseña/i), 'secreta123')
    await actor.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(login).toHaveBeenCalledWith('ronald@test.com', 'secreta123')
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('rechaza credenciales incorrectas', async () => {
    const actor = userEvent.setup()
    const login = vi.fn().mockRejectedValue(new Error('Correo o contraseña incorrectos'))
    vi.mocked(useAuth).mockReturnValue({ user: null, login })
    renderPage()

    await actor.type(screen.getByLabelText(/correo electrónico/i), 'ronald@test.com')
    await actor.type(screen.getByLabelText(/contraseña/i), 'clave-mala')
    await actor.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos')
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument()
  })
})
