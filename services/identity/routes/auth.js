import {Router} from 'express'

const router = Router()

//Formato de correo electronico
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function validateRegisterInput({email, password, fullName}) {
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
router.post('/register', (req, res) => {
  const {email, password, fullName} = req.body ?? {}
  const error = validateRegisterInput({email, password, fullName})
  if (error) {
    return res.status(400).json({error})
  }
  res.json({ message: 'Datos válidos' })
})

export default router
