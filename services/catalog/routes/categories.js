import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// GET /categories 
router.get('/categories', async (req, res) => {
  const { rows } = await pool.query(
    `select c.id, c.name, c.slug, c.image_url, count(p.id)::int as product_count
     from catalog.categories c
     left join catalog.products p on p.category_id = c.id and p.is_active
     group by c.id
     order by c.id`
  )

  res.json(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      imageUrl: row.image_url,
      productCount: row.product_count
    }))
  )
})

export default router
