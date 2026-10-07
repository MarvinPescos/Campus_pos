import type { Receipt } from './checkout'

export default function TransactionResult({ receipt, showReceipt, onViewReceipt, onNewTransaction }: {
  receipt: Receipt
  showReceipt: boolean
  onViewReceipt: () => void
  onNewTransaction: () => void
}) {
  return <>
    {showReceipt ? <>
      <h2>{receipt.storeName}</h2>
      <dl className="receipt-details">
        <dt>Transaction Reference</dt><dd>{receipt.reference}</dd>
        <dt>Date / Time</dt><dd><time dateTime={receipt.createdAt}>{new Date(receipt.createdAt).toLocaleString()}</time></dd>
        <dt>Payment Method</dt><dd>{{ cash: 'Cash', qr: 'QR', card: 'Card' }[receipt.paymentMethod]}</dd>
      </dl>
      <ul className="order-lines">
        {receipt.lines.map((line) => <li key={line.productId}>
          <h3>{line.name}</h3>
          <p>{line.quantity} × ₱{line.price}</p>
          <p>Subtotal: ₱{line.subtotal}</p>
        </li>)}
      </ul>
      <p className="total"><span>Total</span><strong>₱{receipt.total}</strong></p>
      {receipt.paymentMethod === 'cash' && <dl className="receipt-details">
        <dt>Cash Tendered</dt><dd>₱{receipt.cashTendered}</dd>
        <dt>Change</dt><dd>₱{receipt.change}</dd>
      </dl>}
    </> : <>
      <h2>Transaction Reference</h2>
      <p>{receipt.reference}</p>
    </>}
    <div className="screen-actions">
      {!showReceipt && <button type="button" onClick={onViewReceipt}>View Receipt</button>}
      <button type="button" className="primary" onClick={onNewTransaction}>New Transaction</button>
    </div>
  </>
}
