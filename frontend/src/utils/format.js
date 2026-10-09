// Formatos de moneda y fecha compartidos por checkout y pedidos
const jpyFormatter = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })
const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const dateFormatter = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' })

export function formatJpy(amount) {
  return jpyFormatter.format(amount)
}

export function formatUsd(amount) {
  return usdFormatter.format(amount)
}

export function formatDate(isoDate) {
  return dateFormatter.format(new Date(isoDate))
}

export const ORDER_STATUS_LABELS = {
  pending: 'Pendiente',
  purchased: 'Comprado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
}
