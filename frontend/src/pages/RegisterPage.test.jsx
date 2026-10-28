// TC-UI-01 Registro: alta exitosa y rechazo de datos inválidos
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterPage } from './RegisterPage.jsx'
import { useAuth } from '../auth/useAuth.js'

vi.mock('../auth/useAuth.js', () => ({ useAuth: vi.fn() }))

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/registro']}>
      <Routes>
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/" element={<h1>Inicio</h1>} />
      </Routes>
    </MemoryRouter>
  )
}

async function fillForm(actor, { name, email, password, confirm }) {
  const [passwordInput, confirmInput] = screen.getAllByLabelText(/contraseña/i)
  await actor.type(screen.getByLabelText(/nombre completo/i), name)
  await actor.type(screen.getByLabelText(/correo electrónico/i), email)
  await actor.type(passwordInput, password)
  await actor.type(confirmInput, confirm)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAuth).mockReturnValue({ user: null, register: vi.fn() })
})

describe('TC-UI-01 Registro', () => {
  it('registra con datos válidos y entra a la tienda', async () => {
    const actor = userEvent.setup()
    const register = vi.fn().mockResolvedValue({ email: 'ronald@test.com' })
    vi.mocked(useAuth).mockReturnValue({ user: null, register })
    renderPage()

    await fillForm(actor, {
      name: 'Ronald',
      email: 'ronald@test.com',
      password: 'secreta123',
      confirm: 'secreta123',
    })
    await actor.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(register).toHaveBeenCalledWith('Ronald', 'ronald@test.com', 'secreta123')
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('rechaza cuando las contraseñas no coinciden', async () => {
    const actor = userEvent.setup()
    const register = vi.fn()
    vi.mocked(useAuth).mockReturnValue({ user: null, register })
    renderPage()

    await fillForm(actor, {
      name: 'Ronald',
      email: 'ronald@test.com',
      password: 'secreta123',
      confirm: 'otra12345',
    })
    await actor.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })
})
