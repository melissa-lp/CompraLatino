import jwt from 'jsonwebtoken'
export function requireAuth(req, res, next) {
    const header = req.headers.authorization ?? ''
    const [scheme, token] = header.split(' ')

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Debes iniciar sesión' })
    }

    let payload
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    }
    catch {
        return res.status(401).json({ error: 'La sesión no es válida o ha expirado' })
    }

    req.user = { id: payload.sub, role: payload.role }
    req.headers['x-user-id'] = payload.sub
    req.headers['x-user-role'] = payload.role
    next()
}

export function requireRole(role) {
    return (req, res, next) => {
        if (req.user?.role !== role) {
            return res.status(403).json({ error: 'No tienes permiso para acceder a este recurso' })
        }
        next()
    }
}