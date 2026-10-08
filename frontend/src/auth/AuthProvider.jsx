import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api/client.js'
import { AuthContext } from './AuthContext.js'

const TOKEN_KEY = 'compralatino_token'

// localStorage puede fallar
function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Sin almacenamiento disponible: se ignora
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken)
  const [user, setUser] = useState(null)
  // Mientras se verifica un token guardado no sabemos si hay sesión: evita mandar al login por error
  const [isLoading, setIsLoading] = useState(() => readStoredToken() !== null)

  // Al abrir la página con un token guardado, se le pregunta a identity si sigue siendo válido
  useEffect(() => {
    if (!token || user) return

    let cancelled = false
    apiFetch('/auth/me', { token })
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch((error) => {
        if (!cancelled && (error.status === 401 || error.status === 404)) {
          storeToken(null)
          setToken(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, user])

  const login = useCallback(async (email, password) => {
    const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } })
    storeToken(data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  // Después de registrarse se inicia sesión automáticamente
  const register = useCallback(async (fullName, email, password) => {
    await apiFetch('/auth/register', { method: 'POST', body: { fullName, email, password } })
    return login(email, password)
  }, [login])

  const logout = useCallback(() => {
    storeToken(null)
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout }),
    [user, token, isLoading, login, register, logout]
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
