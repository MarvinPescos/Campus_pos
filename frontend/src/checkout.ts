import type { Order } from './order'

export type Receipt = {
  reference: string
  storeName: string
  createdAt: string
  lines: { productId: string; name: string; quantity: number; price: number; subtotal: number }[]
  total: number
  paymentMethod: 'cash' | 'qr' | 'card'
  cashTendered?: number
  change?: number
}

const money = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

function isReceipt(value: unknown): value is Receipt {
  if (!value || typeof value !== 'object') return false
  const receipt = value as Partial<Receipt>
  return typeof receipt.reference === 'string' && /^TXN-\d{8}-[A-Z0-9]{6}$/.test(receipt.reference)
    && typeof receipt.storeName === 'string' && receipt.storeName.length > 0
    && typeof receipt.createdAt === 'string' && Number.isFinite(Date.parse(receipt.createdAt))
    && money(receipt.total) && receipt.total > 0
    && Array.isArray(receipt.lines) && receipt.lines.length > 0 && receipt.lines.every((line) =>
      line && typeof line.productId === 'string' && line.productId.length > 0
      && typeof line.name === 'string' && line.name.length > 0
      && Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= 99
      && money(line.price) && line.price > 0 && money(line.subtotal) && line.subtotal > 0,
    )
    && (receipt.paymentMethod === 'cash'
      ? money(receipt.cashTendered) && money(receipt.change)
      : receipt.paymentMethod === 'qr' || receipt.paymentMethod === 'card')
}

export async function checkout(order: Order, paymentMethod: Receipt['paymentMethod'], cashTendered?: number): Promise<Receipt> {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lines: order.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
      paymentMethod,
      ...(paymentMethod === 'cash' ? { cashTendered } : {}),
    }),
  })
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null)
    throw new Error(data && typeof data === 'object' && 'detail' in data
      && typeof data.detail === 'string' && data.detail.length > 0
      ? data.detail : 'Payment failed. Please try again.')
  }
  const data: unknown = await response.json().catch(() => null)
  if (response.status !== 201 || !isReceipt(data) || data.paymentMethod !== paymentMethod) {
    throw new Error('The payment response is incomplete. Please check the transaction before retrying.')
  }
  return data
}
