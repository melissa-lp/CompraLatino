import { Router } from 'express'
import pool from '../db.js'

// Rutas para otros servicios 
const router = Router()

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_IDS = 50

// GET /internal/products?ids=uuid1,uuid2 — precio y stock ACTUALES de varios productos
router.get('/internal/products', async (req, res) => {
  const ids = typeof req.query.ids === 'string' ? req.query.ids.split(',').filter(Boolean) : []
  if (ids.length === 0 || ids.length > MAX_IDS || !ids.every((id) => UUID_REGEX.test(id))) {
    return res.status(400).json({ error: `Envía entre 1 y ${MAX_IDS} ids de producto válidos` })
  }

  const { rows } = await pool.query(
    `select p.id, p.yauctions_item_id, p.title, p.price_jpy, p.stock, p.is_active, p.category_id,
            i.url as image_url
     from catalog.products p
     left join catalog.product_images i on i.product_id = p.id and i.position = 0
     where p.id = any($1::uuid[])`,
    [ids]
  )

  res.json(
    rows.map((row) => ({
      id: row.id,
      yauctionsItemId: row.yauctions_item_id,
      title: row.title,
      priceJpy: row.price_jpy,
      stock: row.stock,
      isActive: row.is_active,
      categoryId: row.category_id,
      imageUrl: row.image_url
    }))
  )
})

export default router
