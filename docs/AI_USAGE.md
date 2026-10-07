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
