# AI-Assisted Development Log

## Entry 1 — Project Setup and Architecture

### Prompt / Task
Asked AI to help prepare the IT415 POS practical exam project using
React + TypeScript for the frontend and FastAPI for the backend.

### AI Recommendation
Use a single repository containing frontend and backend applications,
with static/in-memory data and simulated payments.

### Evaluation
The approach satisfies the exam requirements without requiring a
database or real payment gateway.

### Modification / Decision
We kept FastAPI intentionally small and did not add PostgreSQL,
SQLAlchemy, authentication, or inventory because they are not required
for the practical exam.

## Entry 2 — Catalog and Item Selection (issue #2)

### Prompt / Task
Asked AI to implement the first slice: `GET /api/products`, the Item
Selection screen with Category filters, and the "Your Order" panel.

### AI Recommendation
Hardcode the 6 sample Products in a backend catalog module, test the
endpoint through FastAPI's test client, proxy `/api` from Vite to avoid
CORS, and keep the Order in a single `useReducer` with quantity clamped
to 1–99.

### Evaluation
Matches the PRD and ADR-0001: prices are whole-peso integers from the
backend, and the frontend Total is for display only.

### Modification / Decision
Emoji placeholders stand in for product icons until real assets arrive.
"Proceed to Payment" is only enabled/disabled in this slice; wiring it
to the Order Summary is left to the Review slice.
