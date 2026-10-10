import { Router } from 'express'
import pool from '../db.js'

const router = Router()

const MAX_SEARCH_LENGTH = 100
const MAX_LIMIT = 100

function escapeLikePattern(text) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`)
}

const SORT_OPTIONS = {
  newest: 'p.created_at desc, p.yauctions_item_id desc',
  oldest: 'p.created_at asc, p.yauctions_item_id asc',
  price_asc: 'p.price_jpy asc, p.title',
  price_desc: 'p.price_jpy desc, p.title'
}

router.get('/products', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (q.length > MAX_SEARCH_LENGTH) {
    return res.status(400).json({ error: `La búsqueda admite como máximo ${MAX_SEARCH_LENGTH} caracteres` })
  }

  const category = typeof req.query.category === 'string' ? req.query.category.trim() : ''
  const orderBy = Object.hasOwn(SORT_OPTIONS, req.query.sort) ? SORT_OPTIONS[req.query.sort] : SORT_OPTIONS.newest


  const values = []
  let searchFilter = ''
  if (q !== '') {
    values.push(`%${escapeLikePattern(q)}%`)
    searchFilter += ` and (p.title ilike $${values.length} or c.name ilike $${values.length})`
  }
  if (category !== '') {
    values.push(category)
    searchFilter += ` and c.slug = $${values.length}`
  }

  let limitClause = ''
  if (req.query.limit !== undefined) {
    const limit = Number(req.query.limit)
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return res.status(400).json({ error: `limit debe ser un entero entre 1 y ${MAX_LIMIT}` })
    }
    values.push(limit)
    limitClause = `limit $${values.length}`
  }

  const { rows } = await pool.query(
    `select p.id, p.title, p.description, p.price_jpy, p.stock, p.condition,
            c.name as category_name, c.slug as category_slug, i.url as image_url
     from catalog.products p
     join catalog.categories c on c.id = p.category_id
     left join catalog.product_images i on i.product_id = p.id and i.position = 0
     where p.is_active ${searchFilter}
     order by ${orderBy}
     ${limitClause}`,
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
