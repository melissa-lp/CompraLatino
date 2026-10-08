// Todas las peticiones del frontend pasan por aquí y van al API Gateway (nunca directo a un servicio)
const API_URL = import.meta.env.VITE_API_URL

// Error con el código HTTP
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Intenta de nuevo en unos minutos.', 0)
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(data?.error ?? 'Ocurrió un error inesperado', response.status)
  }
  return data
}
