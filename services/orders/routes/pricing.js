import { Router } from 'express'
import { getPricingConfig } from '../lib/pricing.js'

const router = Router()

// GET /pricing — tipo de cambio y cargo por servicio vigentes
router.get('/pricing', (req, res) => {
  res.json(getPricingConfig())
})

export default router
