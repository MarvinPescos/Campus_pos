import { useEffect, useReducer, useRef, useState } from 'react'
import { orderReducer, subtotal, total } from './order'
import type { Product } from './order'
import Payment from './Payment'
import type { Receipt } from './checkout'
import TransactionResult from './TransactionResult'
import './App.css'

type Screen = 'item-selection' | 'order-summary' | 'payment-method'
  | 'payment-processing' | 'payment-successful' | 'receipt'

const screenTitles: Record<Screen, string> = {
  'item-selection': 'Item Selection',
  'order-summary': 'Order Summary',
  'payment-method': 'Payment Method',
  'payment-processing': 'Payment Processing',
  'payment-successful': 'Payment Successful',
  receipt: 'Receipt',
}

function App() {
  const [screen, setScreen] = useState<Screen>('item-selection')
  const [order, dispatch] = useReducer(orderReducer, [])
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => { heading.current?.focus() }, [screen])

  function newTransaction() {
    dispatch({ type: 'reset' })
    setReceipt(null)
    setScreen('item-selection')
  }

  useEffect(() => {
    const controller = new AbortController()
    async function loadProducts() {
      try {
        const response = await fetch('/api/products', { signal: controller.signal })
        if (!response.ok) throw new Error('Unable to load products. Please try again.')
        const data: unknown = await response.json()
        if (!Array.isArray(data) || data.length === 0 || !data.every(
          (product) => product && typeof product.id === 'string' && product.id.length > 0
            && typeof product.name === 'string' && product.name.length > 0
            && typeof product.icon === 'string' && Number.isSafeInteger(product.price)
            && product.price > 0,
        ) || new Set(data.map((product) => product.id)).size !== data.length) {
          throw new Error('The product list is unavailable. Please try again.')
        }
        if (!controller.signal.aborted) setProducts(data)
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Unable to load products. Please try again.')
        }
      }
    }
    void loadProducts()
    return () => controller.abort()
  }, [attempt])

  return (
    <main>
      <header className="store-header">
        <p>IT415 Café</p>
        <h1 ref={heading} tabIndex={-1}>{screenTitles[screen]}</h1>
      </header>
      {screen === 'item-selection' ? <div className="selection-layout">
        <section aria-labelledby="products-heading">
          <h2 id="products-heading">Choose your items</h2>
          {!products && !error && <p role="status">Loading products…</p>}
          {error && <div role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => { setError(''); setAttempt(attempt + 1) }}>Try Again</button>
          </div>}
          <div className="products">
            {products?.map((product) => (
              <button className="product-card" type="button" key={product.id}
                onClick={() => dispatch({ type: 'add', product })}>
                <span className="product-icon" aria-hidden="true">{product.icon}</span>
                <strong>{product.name}</strong>
                <span>₱{product.price}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="order-panel" aria-labelledby="order-heading">
          <h2 id="order-heading">Order</h2>
          {order.length === 0 && <p>No items yet — tap a product</p>}
          <ul className="order-lines">
            {order.map((line) => (
              <li key={line.product.id}>
                <h3>{line.product.name}</h3>
                <p>{line.quantity} × ₱{line.product.price} = ₱{subtotal(line)}</p>
                <div className="quantity-controls">
                  <button type="button" aria-label={`Decrease ${line.product.name}`}
                    disabled={line.quantity === 1}
                    onClick={() => dispatch({ type: 'decrement', productId: line.product.id })}>−</button>
                  <span aria-label={`Quantity ${line.quantity}`}>{line.quantity}</span>
                  <button type="button" aria-label={`Increase ${line.product.name}`}
                    disabled={line.quantity === 99}
                    onClick={() => dispatch({ type: 'increment', productId: line.product.id })}>+</button>
                  <button type="button" className="remove"
                    aria-label={`Remove ${line.product.name}`}
                    onClick={() => dispatch({ type: 'remove', productId: line.product.id })}>Remove</button>
                </div>
                {line.quantity === 99 && <p className="quantity-note">Maximum quantity: 99</p>}
              </li>
            ))}
          </ul>
          <p className="total" aria-live="polite"><span>Total</span><strong>₱{total(order)}</strong></p>
          <button className="primary proceed" type="button" disabled={order.length === 0}
            onClick={() => setScreen('order-summary')}>Proceed</button>
        </section>
      </div> : screen === 'order-summary' ? (
        <section className="screen-panel" aria-label="Order Summary">
          <ul className="order-lines">
            {order.map((line) => (
              <li key={line.product.id}>
                <h2>{line.product.name}</h2>
                <p>{line.quantity} × ₱{line.product.price} = ₱{subtotal(line)}</p>
              </li>
            ))}
          </ul>
          <p className="total"><span>Total</span><strong>₱{total(order)}</strong></p>
          <div className="screen-actions">
            <button type="button" onClick={() => setScreen('item-selection')}>Back</button>
            <button type="button" className="primary" disabled={order.length === 0}
              onClick={() => setScreen('payment-method')}>Proceed</button>
          </div>
        </section>
      ) : (
        <section className="screen-panel" aria-label={screenTitles[screen]}>
          {(screen === 'payment-method' || screen === 'payment-processing') && <Payment order={order}
            processing={screen === 'payment-processing'}
            onBack={() => setScreen('order-summary')}
            onProcessing={(processing) => setScreen(processing ? 'payment-processing' : 'payment-method')}
            onSuccess={(paidReceipt) => { setReceipt(paidReceipt); setScreen('payment-successful') }} />}
          {(screen === 'payment-successful' || screen === 'receipt') && receipt && <TransactionResult
            receipt={receipt} showReceipt={screen === 'receipt'}
            onViewReceipt={() => setScreen('receipt')} onNewTransaction={newTransaction} />}
        </section>
      )}
    </main>
  )
}

export default App
