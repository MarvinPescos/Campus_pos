from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_get_products_returns_the_six_products_with_whole_peso_prices():
    response = client.get("/api/products")

    assert response.status_code == 200
    assert response.json() == [
        {"id": "brewed-coffee", "name": "Brewed Coffee", "price": 90, "icon": "☕"},
        {"id": "cafe-latte", "name": "Café Latte", "price": 120, "icon": "🥛"},
        {"id": "iced-tea", "name": "Iced Tea", "price": 75, "icon": "🧋"},
        {"id": "hot-chocolate", "name": "Hot Chocolate", "price": 110, "icon": "🍫"},
        {"id": "ham-cheese-sandwich", "name": "Ham & Cheese Sandwich", "price": 150, "icon": "🥪"},
        {"id": "blueberry-muffin", "name": "Blueberry Muffin", "price": 85, "icon": "🧁"},
    ]
