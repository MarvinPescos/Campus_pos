export type Product = { id: string; name: string; price: number; icon: string }
export type OrderLine = { product: Product; quantity: number }
export type Order = OrderLine[]
export type OrderAction =
  | { type: 'add'; product: Product }
  | { type: 'increment' | 'decrement' | 'remove'; productId: string }
  | { type: 'reset' }

export const subtotal = (line: OrderLine): number => line.product.price * line.quantity
export const total = (order: Order): number => order.reduce((sum, line) => sum + subtotal(line), 0)

export function orderReducer(state: Order, action: OrderAction): Order {
  if (action.type === 'reset') return []
  if (action.type === 'remove') return state.filter((line) => line.product.id !== action.productId)
  if (action.type === 'add') {
    if (state.some((line) => line.product.id === action.product.id)) {
      return state.map((line) => line.product.id === action.product.id
        ? { ...line, quantity: Math.min(99, line.quantity + 1) }
        : line)
    }
    return [...state, { product: action.product, quantity: 1 }]
  }
  if (action.type === 'increment' || action.type === 'decrement') {
    return state.map((line) => line.product.id === action.productId
      ? { ...line, quantity: Math.min(99, Math.max(1, line.quantity + (action.type === 'increment' ? 1 : -1))) }
      : line)
  }
  return state
}
