import { OrderError } from './errors.js'

export async function purchaseInYAuctions(lines) {
  let response
  try {
    response = await fetch(`${process.env.YAUCTIONS_API_URL}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: lines.map((line) => ({ itemId: line.yauctionsItemId, quantity: line.quantity }))
      }),
      signal: AbortSignal.timeout(15000)
    })
  } catch {
    throw new OrderError('YAuctions no responde. No se realizó ningún cobro; intenta más tarde.', 502)
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    // 409 = sin stock; cualquier otro error esß (502)
    const status = response.status === 409 ? 409 : 502
    throw new OrderError(data?.error ?? 'YAuctions rechazó la compra', status)
  }
  return data
}
