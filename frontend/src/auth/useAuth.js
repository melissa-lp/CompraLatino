import { useContext } from 'react'
import { AuthContext } from './AuthContext.js'

// Da acceso a { user, token, isLoading, login, register, logout } desde cualquier componente
export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return auth
}
