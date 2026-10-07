from fastapi import FastAPI

from backend.catalog import PRODUCTS, Product

app = FastAPI(title="Campus POS API")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/products")
def list_products() -> list[Product]:
    return PRODUCTS
