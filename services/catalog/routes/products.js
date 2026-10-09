import { Router } from 'express'
import pool from '../db.js'

const router = Router()

const MAX_SEARCH_LENGTH = 100

function escapeLikePattern(text) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`)
}

router.get('/products', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (q.length > MAX_SEARCH_LENGTH) {
    return res.status(400).json({ error: `La búsqueda admite como máximo ${MAX_SEARCH_LENGTH} caracteres` })
  }

  const values = []
  let searchFilter = ''
  if (q !== '') {
    values.push(`%${escapeLikePattern(q)}%`)
    searchFilter = 'and (p.title ilike $1 or c.name ilike $1)'
  }

  const { rows } = await pool.query(
    `select p.id, p.title, p.description, p.price_jpy, p.stock, p.condition,
            c.name as category_name, c.slug as category_slug, i.url as image_url
     from catalog.products p
     join catalog.categories c on c.id = p.category_id
     left join catalog.product_images i on i.product_id = p.id and i.position = 0
     where p.is_active ${searchFilter}
     order by p.created_at desc`,
    values
  )

  res.json(
    rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      priceJpy: row.price_jpy,
      stock: row.stock,
      condition: row.condition,
      categoryName: row.category_name,
      categorySlug: row.category_slug,
      imageUrl: row.image_url
    }))
  )
})

export default router
