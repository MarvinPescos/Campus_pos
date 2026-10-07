from fastapi import FastAPI

from backend.catalog import PRODUCTS, Product

app = FastAPI(title="IT415 POS API")


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/products")
def list_products() -> list[Product]:
    return PRODUCTS
