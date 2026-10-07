import { useEffect, useRef, useState } from 'react'
import './Payment.css'

type PaymentMethod = 'Cash' | 'QR' | 'Card'

export default function Payment({ total, onBack, onConfirm }: {
  total: number
  onBack: () => void
  onConfirm: (cashTendered: number) => void
}) {
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [cash, setCash] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const cashTendered = Number(cash)
  const canConfirm = total > 0 && cashTendered >= total
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', '00', 'Backspace']

  useEffect(() => { heading.current?.focus() }, [method])

  function back() {
    setCash('')
    setMethod(null)
  }

  return <>
    <h2 ref={heading} tabIndex={-1}>{method === 'Cash' ? 'Cash entry' : method ? `${method} payment` : 'Choose a Payment Method'}</h2>
    <p className="total"><span>Total</span><strong>₱{total}</strong></p>
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
          onClick={() => { if (canConfirm) onConfirm(cashTendered) }}>Confirm</button>
      </div>
    </> : <>
      <p role="status">{method} payment simulation is not available yet.</p>
      <div className="screen-actions"><button type="button" onClick={back}>Back</button></div>
    </>}
  </>
}
