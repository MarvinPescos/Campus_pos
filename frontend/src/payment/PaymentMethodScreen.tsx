import { useState } from 'react'
import './PaymentMethodScreen.css'

export type PaymentMethod = 'cash' | 'qr' | 'card'

export type PaymentSelection =
  | { paymentMethod: 'cash'; cashTendered: number }
  | { paymentMethod: 'qr' | 'card' }

type Props = {
  total: number
  onBack: () => void
  onConfirm: (payment: PaymentSelection) => void
}

const methods = [
  { id: 'cash', name: 'Cash', icon: '💵', description: 'Enter cash tendered' },
  { id: 'qr', name: 'QR', icon: '▦', description: 'Pay with a QR code' },
  { id: 'card', name: 'Card', icon: '💳', description: 'Credit / Debit Card' },
] as const
const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '00', 'Backspace']
const money = (amount: number) => '₱' + amount.toLocaleString('en-PH')

export default function PaymentMethodScreen({ total, onBack, onConfirm }: Props) {
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [cash, setCash] = useState('')
  const selectedMethod = methods.find((item) => item.id === method)
  const cashTendered = Number(cash)
  const validTotal = Number.isSafeInteger(total) && total > 0
  const sufficientCash = validTotal && cash !== '' && cashTendered >= total

  function enterCash(key: string) {
    setCash((value) => {
      if (key === 'Clear') return ''
      if (key === 'Backspace') return value.slice(0, -1)
      const next = (value + key).replace(/^0+(?=\d)/, '')
      return Number.isSafeInteger(Number(next)) ? next : value
    })
  }

  function back() {
    if (method) {
      setMethod(null)
      setCash('')
    } else {
      onBack()
    }
  }

  return (
    <section className="payment-screen" aria-labelledby="payment-heading">
      <header className="payment-header">
        <button type="button" className="secondary" onClick={back}>
          ← Back to {method ? 'Payment Method' : 'Order Summary'}
        </button>
        <span className="step-label">Payment</span>
      </header>
      <div className="payment-title">
        <p className="eyebrow">IT415 Café</p>
        <h1 id="payment-heading">{method === 'cash' ? 'Cash entry' : method ? selectedMethod?.name + ' payment' : 'Payment Method'}</h1>
        <p>{method === 'cash' ? 'Enter the cash received from the customer.' : 'Choose how the customer would like to pay.'}</p>
      </div>
      <div className="amount-due">
        <span>Total amount due</span>
        <strong>{validTotal ? money(total) : '—'}</strong>
      </div>
      {!validTotal && <p role="alert" className="cash-feedback">Return to the Order Summary to check the total before payment.</p>}
      {!method && (
        <div className="payment-methods" aria-label="Payment methods">
          {methods.map((item) => (
            <button type="button" className="method-button" key={item.id} disabled={!validTotal} onClick={() => setMethod(item.id)}>
              <span className="method-icon" aria-hidden="true">{item.icon}</span>
              <strong>{item.name}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>
      )}
      {method === 'cash' && (
        <div className="cash-layout">
          <div className="cash-details">
            <label htmlFor="cash-tendered">Cash Tendered</label>
            <output id="cash-tendered" className="cash-amount" aria-live="polite">{money(cashTendered)}</output>
            <p className={'cash-feedback ' + (sufficientCash ? 'sufficient' : '')} role="status">
              {validTotal && (sufficientCash ? 'Change: ' + money(cashTendered - total) : money(total - cashTendered) + ' more needed')}
            </p>
            <p className="cash-hint">Whole pesos only. Use the keypad below.</p>
            <button type="button" className="primary" disabled={!sufficientCash} onClick={() => onConfirm({ paymentMethod: 'cash', cashTendered })}>Confirm Cash</button>
          </div>
          <div className="cash-keypad" aria-label="Cash entry keypad">
            {keys.map((key) => (
              <button type="button" key={key} className={key === 'Backspace' ? 'backspace secondary' : 'secondary'} onClick={() => enterCash(key)}>{key}</button>
            ))}
          </div>
        </div>
      )}
      {(method === 'qr' || method === 'card') && (
        <div className="payment-choice">
          <p>Selected Payment Method: {selectedMethod?.name}</p>
          <button type="button" className="primary" disabled={!validTotal} onClick={() => onConfirm({ paymentMethod: method })}>Continue with {selectedMethod?.name}</button>
        </div>
      )}
    </section>
  )
}
