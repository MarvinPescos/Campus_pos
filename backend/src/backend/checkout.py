import secrets
import string
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, StrictInt
from pydantic.alias_generators import to_camel

from backend.catalog import PRODUCTS

STORE_NAME = "IT415 Café"

PaymentMethod = Literal["cash", "qr", "card"]


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class OrderLine(CamelModel):
    product_id: str
    quantity: StrictInt


class CheckoutRequest(CamelModel):
    lines: list[OrderLine]
    payment_method: PaymentMethod
    cash_tendered: int | None = None


class ReceiptLine(CamelModel):
    product_id: str
    name: str
    quantity: int
    price: int
    subtotal: int


class Receipt(CamelModel):
    reference: str
    store_name: str
    created_at: datetime
    lines: list[ReceiptLine]
    total: int
    payment_method: PaymentMethod
    cash_tendered: int | None = None
    change: int | None = None


class CheckoutError(Exception):
    """An Order that cannot become a Transaction; the message is shown to the cashier."""


_PRODUCTS_BY_ID = {product.id: product for product in PRODUCTS}

_REFERENCE_ALPHABET = string.ascii_uppercase + string.digits

# Transactions are not stored; only their Transaction References are remembered, to keep them unique.
_issued_references: set[str] = set()


def checkout(request: CheckoutRequest) -> Receipt:
    if not request.lines:
        raise CheckoutError("Order is empty")
    lines = []
    for line in request.lines:
        product = _PRODUCTS_BY_ID.get(line.product_id)
        if product is None:
            raise CheckoutError(f"Unknown product: {line.product_id}")
        if not 1 <= line.quantity <= 99:
            raise CheckoutError(
                f"Quantity for {line.product_id} must be between 1 and 99, got {line.quantity}"
            )
        lines.append(
            ReceiptLine(
                product_id=product.id,
                name=product.name,
                quantity=line.quantity,
                price=product.price,
                subtotal=product.price * line.quantity,
            )
        )
    total = sum(line.subtotal for line in lines)
    cash_tendered = change = None
    if request.payment_method == "cash":
        cash_tendered = request.cash_tendered
        if cash_tendered is None:
            raise CheckoutError("Cash Tendered is required for cash payments")
        if cash_tendered < total:
            raise CheckoutError(f"Insufficient cash: ₱{total - cash_tendered} more needed")
        change = cash_tendered - total
    created_at = datetime.now()
    return Receipt(
        reference=_issue_reference(created_at),
        store_name=STORE_NAME,
        created_at=created_at,
        lines=lines,
        total=total,
        payment_method=request.payment_method,
        cash_tendered=cash_tendered,
        change=change,
    )


def _issue_reference(created_at: datetime) -> str:
    while True:
        suffix = "".join(secrets.choice(_REFERENCE_ALPHABET) for _ in range(6))
        reference = f"TXN-{created_at:%Y%m%d}-{suffix}"
        if reference not in _issued_references:
            _issued_references.add(reference)
            return reference
