# Campus POS

A touchscreen point-of-sale system where a cashier builds an Order, takes payment, and issues a Receipt.

## Catalog

**Product**:
An item offered for sale, with a name, a whole-peso price, and an emoji icon shown on its card.
_Avoid_: Item, SKU

## Ordering

**Order**:
The set of Products being purchased, built up before payment.
_Avoid_: Cart, basket

**Order Line**:
One Product in an Order together with its quantity.
_Avoid_: Cart item, row

**Subtotal**:
An Order Line's quantity multiplied by its Product's price.

**Total**:
The sum of all Subtotals in an Order.
_Avoid_: Grand total, amount due

## Payment

**Payment Method**:
How the customer pays: Cash, QR, or Card.
_Avoid_: Payment type, tender type

**Cash Tendered**:
The amount of cash the customer hands over in a Cash payment.
_Avoid_: Amount paid, cash received

**Change**:
Cash Tendered minus the Total, returned to the customer.

**Transaction**:
A paid Order. Only exists once payment succeeds.
_Avoid_: Sale, purchase, using "transaction" for an unpaid Order

**Transaction Reference**:
The unique identifier of a Transaction.
_Avoid_: Receipt number, order ID

**Receipt**:
The digital record of a Transaction shown to the customer.
_Avoid_: Invoice
