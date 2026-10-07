# Campus POS

A touchscreen point-of-sale app for "IT415 Café": a React + TypeScript frontend backed by a FastAPI service.

Start the backend and frontend in separate terminals from the repository root.

## Running the backend

Requires [uv](https://docs.astral.sh/uv/).

```sh
cd backend
uv run fastapi dev
```

The API is served at http://localhost:8000 (product catalog at `GET /api/products`).

## Running the frontend

```sh
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The frontend forwards `/api` requests to `http://localhost:8000`.

## Testing

Backend:

```sh
cd backend
uv run pytest
```

Frontend:

```sh
cd frontend
npm test
npm run typecheck
npm run lint
npm run build
```
