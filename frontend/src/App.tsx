import { useState } from 'react'
import PaymentMethodScreen from './payment/PaymentMethodScreen'
import type { PaymentSelection } from './payment/PaymentMethodScreen'
import './App.css'

// Temporary preview order until the Order flow is integrated.
const exampleOrder = [
  { name: 'Brewed Coffee', quantity: 1, price: 90 },
  { name: 'Café Latte', quantity: 1, price: 120 },
  { name: 'Iced Tea', quantity: 1, price: 75 },
]
const total = exampleOrder.reduce((sum, line) => sum + line.quantity * line.price, 0)

function App() {
  const [screen, setScreen] = useState<'summary' | 'payment'>('payment')
  const [selection, setSelection] = useState<PaymentSelection | null>(null)

  return (
    <main>
      <aside className="preview-note">Payment screen preview · Example Order · Payments are not submitted</aside>
      {selection ? (
        <section className="summary-preview">
          <h1>Payment entry preview</h1>
          <p role="status">
            {selection.paymentMethod === 'cash' ? 'Cash Tendered ₱' + selection.cashTendered + ' · Change ₱' + (selection.cashTendered - total) : selection.paymentMethod === 'qr' ? 'QR selected' : 'Card selected'}. No Transaction has been created.
          </p>
          <button type="button" className="primary" onClick={() => setSelection(null)}>Return to Payment Method</button>
        </section>
      ) : screen === 'summary' ? (
        <section className="summary-preview" aria-labelledby="summary-heading">
          <h1 id="summary-heading">Order Summary</h1>
          <ul>{exampleOrder.map((line) => <li key={line.name}><strong>{line.name}</strong><span>{line.quantity} × ₱{line.price} = ₱{line.quantity * line.price}</span></li>)}</ul>
          <p className="summary-total">Total: ₱{total}</p>
          <button type="button" className="primary" onClick={() => setScreen('payment')}>Choose Payment Method</button>
        </section>
      ) : (
        <PaymentMethodScreen total={total} onBack={() => { setSelection(null); setScreen('summary') }} onConfirm={setSelection} />
      )}
    </main>
  )
}

export default App
