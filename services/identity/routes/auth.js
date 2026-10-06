import { Router } from 'express'
import bcrypt from 'bcryptjs'
import sql from '../db.js'
import jwt from 'jsonwebtoken'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

//Formato de correo electronico
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8
const SALT_ROUNDS = 10

function validateRegisterInput({ email, password, fullName }) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return 'El correo electrónico no es válido'
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
    }
    if (typeof fullName !== 'string' || fullName.trim() === '') {
        return 'El nombre completo es obligatorio'
    }
    return
}

// POST /auth/register
router.post('/register', async (req, res) => {
    const { email, password, fullName } = req.body ?? {}
    const error = validateRegisterInput({ email, password, fullName })
    if (error) {
        return res.status(400).json({ error })
    }

    try {
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
        const [user] = await sql` 
      INSERT INTO identity.users (email, password_hash, full_name)
      VALUES (${email.trim().toLowerCase()}, ${passwordHash}, ${fullName.trim()})
      RETURNING id, email, full_name, role, created_at
      `
        res.status(201).json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            createdAt: user.created_at
        })
    } catch (err) {
        if(err.code==='23505'){ // 23505 = unique_violation, el correo ya existe
            return res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico.' })
        }
        console.error('Error al registrar usuario:', err.message)
        res.status(500).json({
            error: 'No se pudo registrar el usuario.'
        })

    }
})

// POST /auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {}
    if (typeof email !== 'string' || typeof password !== 'string' || email.trim() === '' || password === '') {
        return res.status(400).json({error: 'El correo electrónico y la contraseña son obligatorios'})
    }
    try {
        const [user] = await sql`
        SELECT id, email, password_hash, full_name, role
        FROM identity.users
        WHERE lower(email) = ${email.trim().toLowerCase()}
        `
        const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false
        if (!passwordMatches) {
            return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' })
        }
        const token = jwt.sign(
            { sub: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h'}
        )

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role }
            })
    } catch (err) {
        console.error('Error al iniciar sesión:', err.message)
        res.status(500).json({
            error: 'No se pudo iniciar sesión.'

        })
    }
})

// GET /auth/me
router.get('/me', requireAuth, async (req, res) => {
    try {
        const [user] = await sql`
        SELECT id, email, full_name, role, created_at
        FROM identity.users
        WHERE id = ${req.user.id}
        `
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' })
        }
        res.json({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            createdAt: user.created_at
        })
    } catch (err) {
        console.error('Error al obtener el usuario:', err.message)
        res.status(500).json({
            error: 'No se pudo obtener el usuario.'
        })
    }
})

export default router
