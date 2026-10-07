# Campus POS

A touchscreen point-of-sale app for "IT415 Café": a React + TypeScript frontend backed by a FastAPI service.

## Running the backend

Requires [uv](https://docs.astral.sh/uv/).

```sh
cd backend
uv run fastapi dev
```

The API is served at http://localhost:8000 (product catalog at `GET /api/products`).

## Testing the backend

```sh
cd backend
uv run pytest
```
