# IT415 Café POS

Start the backend and frontend in separate terminals from the repository root.

Backend:

```powershell
cd backend
uv run fastapi dev src/backend/main.py
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The frontend forwards `/api` requests
to `http://localhost:8000`. The catalog requires the `GET /api/products` endpoint
from issue #2; the current health-check-only backend cannot load products yet.

Frontend checks:

```powershell
cd frontend
npm test
npm run typecheck
npm run lint
npm run build
```
