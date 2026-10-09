import { Router } from 'express'
import pool from '../db.js'
import { SyncError, syncFromYAuctions } from '../lib/sync.js'

// Rutas de administración
const router = Router()

router.post('/admin/sync', async (req, res) => {
  try {
    const summary = await syncFromYAuctions()
    console.log('Sincronización con YAuctions:', summary)
    res.json(summary)
  } catch (error) {
    if (error instanceof SyncError) {
      return res.status(502).json({ error: error.message })
    }
    throw error
  }
})

router.get('/admin/metrics', async (req, res) => {
  const { rows } = await pool.query(
    `select count(*)::int                                  as total_products,
            coalesce(sum(stock), 0)::int                   as total_items_stock,
            coalesce(sum(price_jpy::bigint * stock), 0)::bigint as total_inventory_value_jpy,
            count(distinct category_id)::int               as active_categories
     from catalog.products
     where is_active`
  )
  const metrics = rows[0]
  res.json({
    totalProducts: metrics.total_products,
    totalItemsStock: metrics.total_items_stock,
    totalInventoryValueJpy: Number(metrics.total_inventory_value_jpy),
    activeCategories: metrics.active_categories
  })
})

export default router
