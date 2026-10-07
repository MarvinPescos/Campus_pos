from fastapi import FastAPI

app = FastAPI(title="IT415 POS API")


@app.get("/health")
def health_check():
    return {"status": "ok"}
