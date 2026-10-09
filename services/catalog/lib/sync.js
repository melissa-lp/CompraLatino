import pool from '../db.js'

// Error que se puede mostrar tal cual al administrador
export class SyncError extends Error {}

async function fetchYAuctionsItems() {
  let response
  try {
    response = await fetch(`${process.env.YAUCTIONS_API_URL}/items`)
  } catch {
    throw new SyncError('No se pudo contactar a YAuctions. Revisa que el servicio esté funcionando.')
  }
  if (!response.ok) {
    throw new SyncError(`YAuctions respondió con un error (${response.status})`)
  }
  return response.json()
}

export async function syncFromYAuctions() {
  const items = await fetchYAuctionsItems()

  
  const client = await pool.connect()
  try {
    await client.query('begin')

    // El mock usa el slug de la categoría y se traduce al id interno de catalog
    const { rows: categories } = await client.query('select id, slug from catalog.categories')
    const categoryIds = Object.fromEntries(categories.map((c) => [c.slug, c.id]))

    const summary = { created: 0, updated: 0, deactivated: 0, skipped: [] }
    const syncedItemIds = []

    for (const item of items) {
      const categoryId = categoryIds[item.category]
      if (!categoryId) {
        summary.skipped.push(`${item.itemId} (categoría desconocida: ${item.category})`)
        continue
      }

      // Upsert: inserta, o si el yauctions_item_id ya existe, actualiza sus datos
      const { rows } = await client.query(
        `insert into catalog.products
           (yauctions_item_id, category_id, title, description, price_jpy, stock, condition)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (yauctions_item_id) do update set
           category_id = excluded.category_id,
           title       = excluded.title,
           description = excluded.description,
           price_jpy   = excluded.price_jpy,
           stock       = excluded.stock,
           condition   = excluded.condition,
           is_active   = true,
           updated_at  = now()
         returning id, (xmax = 0) as inserted`,
        [item.itemId, categoryId, item.title, item.description ?? '', item.priceJpy, item.stock, item.condition]
      )
      const { id: productId, inserted } = rows[0]
      if (inserted) summary.created++
      else summary.updated++

      // Las imágenes se reemplazan
      await client.query('delete from catalog.product_images where product_id = $1', [productId])
      for (const [position, url] of item.images.entries()) {
        await client.query(
          'insert into catalog.product_images (product_id, url, position) values ($1, $2, $3)',
          [productId, url, position]
        )
      }

      syncedItemIds.push(item.itemId)
    }

    // Productos desactivados ya no se muestran
    const deactivated = await client.query(
      `update catalog.products set is_active = false, updated_at = now()
       where is_active and yauctions_item_id <> all($1::text[])`,
      [syncedItemIds]
    )
    summary.deactivated = deactivated.rowCount

    await client.query('commit')
    return summary
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}
