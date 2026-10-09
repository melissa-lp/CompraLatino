export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function requireUser(req, res, next) {
  const userId = req.headers['x-user-id']
  if (typeof userId !== 'string' || !UUID_REGEX.test(userId)) {
    return res.status(401).json({ error: 'Debes iniciar sesión' })
  }
  req.userId = userId
  next()
}
