from pydantic import BaseModel


class Product(BaseModel):
    id: str
    name: str
    price: int
    icon: str


PRODUCTS: list[Product] = [
    Product(id="brewed-coffee", name="Brewed Coffee", price=90, icon="☕"),
    Product(id="cafe-latte", name="Café Latte", price=120, icon="🥛"),
    Product(id="iced-tea", name="Iced Tea", price=75, icon="🧋"),
    Product(id="hot-chocolate", name="Hot Chocolate", price=110, icon="🍫"),
    Product(id="ham-cheese-sandwich", name="Ham & Cheese Sandwich", price=150, icon="🥪"),
    Product(id="blueberry-muffin", name="Blueberry Muffin", price=85, icon="🧁"),
]
