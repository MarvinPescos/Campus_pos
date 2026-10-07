import re
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def post_transaction(**body):
    return client.post("/api/transactions", json=body)


def test_card_payment_returns_receipt_with_total_recomputed_from_backend_prices():
    response = post_transaction(
        lines=[
            {"productId": "brewed-coffee", "quantity": 2},
            {"productId": "blueberry-muffin", "quantity": 1},
        ],
        paymentMethod="card",
    )

    assert response.status_code == 201
    receipt = response.json()
    assert receipt["storeName"] == "IT415 Café"
    assert receipt["paymentMethod"] == "card"
    assert receipt["lines"] == [
        {"productId": "brewed-coffee", "name": "Brewed Coffee", "quantity": 2, "price": 90, "subtotal": 180},
        {"productId": "blueberry-muffin", "name": "Blueberry Muffin", "quantity": 1, "price": 85, "subtotal": 85},
    ]
    assert receipt["total"] == 265
    assert "cashTendered" not in receipt
    assert "change" not in receipt


def test_cash_payment_returns_change_from_cash_tendered():
    response = post_transaction(
        lines=[{"productId": "cafe-latte", "quantity": 1}],
        paymentMethod="cash",
        cashTendered=200,
    )

    assert response.status_code == 201
    receipt = response.json()
    assert receipt["total"] == 120
    assert receipt["cashTendered"] == 200
    assert receipt["change"] == 80


def test_exact_cash_returns_zero_change():
    response = post_transaction(
        lines=[{"productId": "iced-tea", "quantity": 2}],
        paymentMethod="cash",
        cashTendered=150,
    )

    assert response.status_code == 201
    assert response.json()["change"] == 0


def test_qr_payment_succeeds_without_change():
    response = post_transaction(lines=[{"productId": "hot-chocolate", "quantity": 1}], paymentMethod="qr")

    assert response.status_code == 201
    receipt = response.json()
    assert receipt["paymentMethod"] == "qr"
    assert receipt["total"] == 110
    assert "cashTendered" not in receipt
    assert "change" not in receipt


def test_insufficient_cash_is_rejected_with_amount_still_needed():
    response = post_transaction(
        lines=[{"productId": "ham-cheese-sandwich", "quantity": 1}],
        paymentMethod="cash",
        cashTendered=100,
    )

    assert response.status_code == 422
    assert response.json() == {"detail": "Insufficient cash: ₱50 more needed"}


def test_cash_payment_without_cash_tendered_is_rejected():
    response = post_transaction(lines=[{"productId": "iced-tea", "quantity": 1}], paymentMethod="cash")

    assert response.status_code == 422
    assert response.json() == {"detail": "Cash Tendered is required for cash payments"}


def test_empty_order_is_rejected():
    response = post_transaction(lines=[], paymentMethod="card")

    assert response.status_code == 422
    assert response.json() == {"detail": "Order is empty"}


def test_unknown_product_is_rejected():
    response = post_transaction(lines=[{"productId": "espresso", "quantity": 1}], paymentMethod="card")

    assert response.status_code == 422
    assert response.json() == {"detail": "Unknown product: espresso"}


@pytest.mark.parametrize("quantity", [0, 100])
def test_quantity_outside_1_to_99_is_rejected(quantity):
    response = post_transaction(lines=[{"productId": "iced-tea", "quantity": quantity}], paymentMethod="card")

    assert response.status_code == 422
    assert response.json() == {"detail": f"Quantity for iced-tea must be between 1 and 99, got {quantity}"}


@pytest.mark.parametrize(
    ("body", "detail"),
    [
        (
            {"lines": [{"productId": "iced-tea", "quantity": 1}], "paymentMethod": "gcash"},
            "paymentMethod: Input should be 'cash', 'qr' or 'card'",
        ),
        ({"paymentMethod": "card"}, "lines: Field required"),
        (
            {"lines": [{"productId": "iced-tea", "quantity": "two"}], "paymentMethod": "card"},
            "lines.0.quantity: Input should be a valid integer",
        ),
        (
            {"lines": [{"productId": "iced-tea", "quantity": True}], "paymentMethod": "card"},
            "lines.0.quantity: Input should be a valid integer",
        ),
    ],
)
def test_malformed_request_is_rejected_with_a_single_readable_detail(body, detail):
    response = post_transaction(**body)

    assert response.status_code == 422
    assert response.json() == {"detail": detail}


def test_receipt_carries_a_reference_dated_today_and_server_created_at():
    before = datetime.now()
    receipt = post_transaction(lines=[{"productId": "iced-tea", "quantity": 1}], paymentMethod="qr").json()
    after = datetime.now()

    assert re.fullmatch(r"TXN-\d{8}-[A-Z0-9]{6}", receipt["reference"])
    assert receipt["reference"][4:12] in {before.strftime("%Y%m%d"), after.strftime("%Y%m%d")}
    assert before <= datetime.fromisoformat(receipt["createdAt"]) <= after


def test_references_are_unique_across_many_transactions():
    references = {
        post_transaction(lines=[{"productId": "iced-tea", "quantity": 1}], paymentMethod="card").json()["reference"]
        for _ in range(500)
    }

    assert len(references) == 500
