import { Router } from 'express'
import sql from '../db.js'
import { OrderError } from '../lib/errors.js'
import { publishOrderCreated } from '../lib/events.js'
import { buildQuote } from '../lib/pricing.js'
import { parseItems, parseShipping } from '../lib/validation.js'
import { purchaseInYAuctions } from '../lib/yauctions.js'
import { requireUser, UUID_REGEX } from '../middleware/currentUser.js'

const router = Router()

router.use('/orders', requireUser)

async function findOrderForUser(orderId, userId) {
  if (!UUID_REGEX.test(orderId)) return null

  const [order] = await sql`
    select id, user_id, status, subtotal_jpy, exchange_rate, service_fee_usd, total_usd,
           shipping_full_name, shipping_phone, shipping_country, shipping_city, shipping_address,
           yauctions_purchase_id, created_at
    from orders.orders
    where id = ${orderId} and user_id = ${userId}
  `
  if (!order) return null

  const items = await sql`
    select product_id, product_title, unit_price_jpy, quantity
    from orders.order_items where order_id = ${orderId} order by product_title
  `
  const history = await sql`
    select status, note, changed_at
    from orders.order_status_history where order_id = ${orderId} order by changed_at, id
  `

  return {
    id: order.id,
    status: order.status,
    subtotalJpy: order.subtotal_jpy,
    exchangeRate: Number(order.exchange_rate),
    serviceFeeUsd: Number(order.service_fee_usd),
    totalUsd: Number(order.total_usd),
    yauctionsPurchaseId: order.yauctions_purchase_id,
    createdAt: order.created_at,
    shipping: {
      fullName: order.shipping_full_name,
      phone: order.shipping_phone,
      country: order.shipping_country,
      city: order.shipping_city,
      address: order.shipping_address
    },
    items: items.map((item) => ({
      productId: item.product_id,
      title: item.product_title,
      unitPriceJpy: item.unit_price_jpy,
      quantity: item.quantity
    })),
    history: history.map((entry) => ({ status: entry.status, note: entry.note, changedAt: entry.changed_at }))
  }
}

// Estado de la orden
async function setOrderStatus(orderId, status, note, yauctionsPurchaseId = null) {
  await sql.begin(async (tx) => {
    await tx`
      update orders.orders
      set status = ${status}, updated_at = now(),
          yauctions_purchase_id = coalesce(${yauctionsPurchaseId}, yauctions_purchase_id)
      where id = ${orderId}
    `
    await tx`insert into orders.order_status_history (order_id, status, note) values (${orderId}, ${status}, ${note})`
  })
}

// POST /orders/quote — cotiza el carrito con precios actuales
router.post('/orders/quote', async (req, res) => {
  const { error, items } = parseItems(req.body?.items)
  if (error) return res.status(400).json({ error })

  res.json(await buildQuote(items))
})

// POST /orders — crea la orden y la compra en YAuctions
router.post('/orders', async (req, res) => {
  const parsedItems = parseItems(req.body?.items)
  if (parsedItems.error) return res.status(400).json({ error: parsedItems.error })
  const parsedShipping = parseShipping(req.body?.shipping)
  if (parsedShipping.error) return res.status(400).json({ error: parsedShipping.error })

  const { shipping } = parsedShipping
  const quote = await buildQuote(parsedItems.items)

  // Se guarda la orden como "pending" ANTES de comprar
  const order = await sql.begin(async (tx) => {
    const [created] = await tx`
      insert into orders.orders
        (user_id, status, subtotal_jpy, exchange_rate, service_fee_usd, total_usd,
         shipping_full_name, shipping_phone, shipping_country, shipping_city, shipping_address)
      values
        (${req.userId}, 'pending', ${quote.subtotalJpy}, ${quote.exchangeRate}, ${quote.serviceFeeUsd}, ${quote.totalUsd},
         ${shipping.fullName}, ${shipping.phone}, ${shipping.country}, ${shipping.city}, ${shipping.address})
      returning id, user_id, created_at
    `
    const itemRows = quote.lines.map((line) => ({
      order_id: created.id,
      product_id: line.productId,
      product_title: line.title,
      unit_price_jpy: line.unitPriceJpy,
      quantity: line.quantity
    }))
    await tx`insert into orders.order_items ${tx(itemRows, 'order_id', 'product_id', 'product_title', 'unit_price_jpy', 'quantity')}`
    await tx`insert into orders.order_status_history (order_id, status, note) values (${created.id}, 'pending', 'Orden creada')`
    return { id: created.id, userId: created.user_id, createdAt: created.created_at }
  })

  // Compra en YAuctions. Si falla, la orden queda "cancelled"
  let purchase
  try {
    purchase = await purchaseInYAuctions(quote.lines)
  } catch (purchaseError) {
    const reason = purchaseError instanceof OrderError ? purchaseError.message : 'Error inesperado al comprar en YAuctions'
    await setOrderStatus(order.id, 'cancelled', reason)
    throw purchaseError
  }

  // Compra confirmada
  await setOrderStatus(order.id, 'purchased', `Comprado en YAuctions (${purchase.purchaseId})`, purchase.purchaseId)

  // Aviso a Recomendaciones 
  publishOrderCreated(order, quote.lines)

  res.status(201).json(await findOrderForUser(order.id, req.userId))
})

// GET /orders — historial de compras del usuario
router.get('/orders', async (req, res) => {
  const orders = await sql`
    select o.id, o.status, o.total_usd, o.created_at,
           coalesce(sum(i.quantity), 0)::int as unit_count
    from orders.orders o
    left join orders.order_items i on i.order_id = o.id
    where o.user_id = ${req.userId}
    group by o.id
    order by o.created_at desc
  `
  res.json(
    orders.map((order) => ({
      id: order.id,
      status: order.status,
      totalUsd: Number(order.total_usd),
      unitCount: order.unit_count,
      createdAt: order.created_at
    }))
  )
})

// GET /orders/:id — detalle de una orden del usuario
router.get('/orders/:id', async (req, res) => {
  const order = await findOrderForUser(req.params.id, req.userId)
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' })
  res.json(order)
})

export default router
