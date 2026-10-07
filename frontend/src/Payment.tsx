import { useEffect, useRef, useState } from 'react'
import { total as orderTotal } from './order'
import type { Order } from './order'
import { checkout } from './checkout'
import type { Receipt } from './checkout'
import './Payment.css'

type PaymentMethod = 'Cash' | 'QR' | 'Card'

export default function Payment({ order, processing, onBack, onProcessing, onSuccess }: {
  order: Order
  processing: boolean
  onBack: () => void
  onProcessing: (processing: boolean) => void
  onSuccess: (receipt: Receipt) => void
}) {
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [cash, setCash] = useState('')
  const [error, setError] = useState('')
  const busy = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const total = orderTotal(order)
  const cashTendered = Number(cash)
  const canConfirm = total > 0 && cashTendered >= total
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '00', 'Backspace']

  useEffect(() => { heading.current?.focus() }, [method])

  function back() {
    setError('')
    setCash('')
    setMethod(null)
  }

  async function submit() {
    if (busy.current || method === null || (method === 'Cash' && !canConfirm)) return
    busy.current = true
    setError('')
    onProcessing(true)
    try {
      const paymentMethod = ({ Cash: 'cash', QR: 'qr', Card: 'card' } as const)[method]
      if (paymentMethod !== 'cash') await new Promise((resolve) => setTimeout(resolve, 1500))
      onSuccess(await checkout(order, paymentMethod, cashTendered))
    } catch (cause) {
      setError(cause instanceof TypeError ? 'Unable to reach the payment service. Please try again.'
        : cause instanceof Error ? cause.message : 'Payment failed. Please try again.')
      onProcessing(false)
    } finally {
      busy.current = false
    }
  }

  if (processing) return <>
    <h2>{method} payment</h2>
    <p className="total"><span>Total</span><strong>₱{total}</strong></p>
    <p role="status">Processing…</p>
    <div className="screen-actions"><button type="button" disabled>Back</button></div>
  </>

  return <>
    <h2 ref={heading} tabIndex={-1}>{method === 'Cash' ? 'Cash entry' : method ? `${method} payment` : 'Choose a Payment Method'}</h2>
    <p className="total"><span>Total</span><strong>₱{total}</strong></p>
    {error && <div role="alert">
      <p>{error}</p>
      <button type="button" disabled={method === 'Cash' && !canConfirm}
        onClick={() => void submit()}>Try Again</button>
    </div>}
    {method === null ? <>
      <div className="payment-methods">
        {(['Cash', 'QR', 'Card'] as const).map((choice) => (
          <button type="button" key={choice} onClick={() => setMethod(choice)}>{choice}</button>
        ))}
      </div>
      <div className="screen-actions"><button type="button" onClick={onBack}>Back</button></div>
    </> : method === 'Cash' ? <>
      <p className="total"><span id="cash-label">Cash Tendered</span><output aria-labelledby="cash-label">₱{cashTendered}</output></p>
      <p role="status" className="cash-feedback">
        {canConfirm ? `Change: ₱${cashTendered - total}` : `₱${total - cashTendered} more needed`}
      </p>
      <p className="cash-note">Enter whole pesos. Maximum: ₱{Number.MAX_SAFE_INTEGER}.</p>
      <div className="cash-keypad" aria-label="Cash keypad">
        {keys.map((key) => (
          <button type="button" key={key}
            className={key === 'Backspace' ? 'cash-backspace' : undefined}
            disabled={/^\d+$/.test(key) && !Number.isSafeInteger(Number(cash + key))}
            onClick={() => setCash((previous) => {
              if (key === 'Clear') return ''
              if (key === 'Backspace') return previous.slice(0, -1)
              const next = (previous + key).replace(/^0+/, '')
              return Number.isSafeInteger(Number(next)) ? next : previous
            })}>{key}</button>
        ))}
      </div>
      <div className="screen-actions">
        <button type="button" onClick={back}>Back</button>
        <button type="button" className="primary" disabled={!canConfirm}
          onClick={() => void submit()}>Confirm</button>
      </div>
    </> : <>
      {method === 'QR' && <div className="qr-placeholder" role="img" aria-label={`Simulated QR payment for ₱${total}`}>
        <img src="/qr-placeholder.png" alt="" /><p>QR placeholder — ₱{total}</p>
      </div>}
      <div className="screen-actions">
        <button type="button" onClick={back}>Back</button>
        <button type="button" className="primary" onClick={() => void submit()}>
          {method === 'QR' ? 'Simulate Customer Paid' : 'Tap / Insert Card'}
        </button>
      </div>
    </>}
  </>
}
