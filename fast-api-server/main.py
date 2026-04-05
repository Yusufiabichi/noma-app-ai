

from fastapi import FastAPI
from app.api.router import api_router
from app.models.loader import load_models
import logging
import uvicorn

app = FastAPI(
    title="NomaApp AI Service",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    logging.info("Starting NomaApp AI Service")
    load_models()
    logging.info("AI models loaded successfully")

app.include_router(api_router, prefix="/ai")

if __name__ == "__main__":
    uvicorn.run(app
                , host='localhost', port=8000)