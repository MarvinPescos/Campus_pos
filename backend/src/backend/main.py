from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from backend.catalog import PRODUCTS, Product
from backend.checkout import CheckoutError, CheckoutRequest, Receipt, checkout

app = FastAPI(title="Campus POS API")


@app.exception_handler(CheckoutError)
def checkout_error_handler(request: Request, exc: CheckoutError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


@app.exception_handler(RequestValidationError)
def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    error = exc.errors()[0]
    field = ".".join(str(part) for part in error["loc"] if part != "body")
    detail = f"{field}: {error['msg']}" if field else error["msg"]
    return JSONResponse(status_code=422, content={"detail": detail})


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/products")
def list_products() -> list[Product]:
    return PRODUCTS


@app.post("/api/transactions", status_code=201, response_model_exclude_none=True)
def create_transaction(request: CheckoutRequest) -> Receipt:
    return checkout(request)
