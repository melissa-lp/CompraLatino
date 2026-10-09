// Publica el evento OrdenCreada para el servicio de Recomendaciones 
export function publishOrderCreated(order, lines) {
  const baseUrl = process.env.RECOMMENDATIONS_URL
  if (!baseUrl) return 

  const event = {
    type: 'OrdenCreada',
    orderId: order.id,
    userId: order.userId,
    purchasedAt: order.createdAt,
    items: lines.map((line) => ({ productId: line.productId, categoryId: line.categoryId, quantity: line.quantity }))
  }

  fetch(`${baseUrl}/events/order-created`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(5000)
  })
    .then((response) => {
      if (!response.ok) console.warn(`Recomendaciones rechazó OrdenCreada ${order.id}: ${response.status}`)
    })
    .catch((error) => console.warn(`No se pudo publicar OrdenCreada ${order.id}:`, error.message))
}
