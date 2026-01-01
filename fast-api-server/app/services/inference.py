from fastapi import APIRouter, HTTPException
from app.schemas.request import InferenceRequest
from app.schemas.response import InferenceResponse
from app.services.preprocess import preprocess_image
from app.models.loader import get_model
import time
router = APIRouter()

@router.post("/infer", response_model=InferenceResponse)
def run_ai_inference(request: InferenceRequest):
    try:
        image_tensor = preprocess_image(request.image_url)
        result = run_inference(request.crop_type, image_tensor)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return InferenceResponse(
        scan_id=request.scan_id,
        disease=result["disease"],
        confidence=result["confidence"],
        severity="unknown",
        recommendation="AI analysis in progress"
    )



CONFIDENCE_THRESHOLD = 0.5

def run_inference(crop_type: str, image_tensor):
    start_time = time.time()

    model_entry = get_model(crop_type)
    model = model_entry["model"]

    prediction = {
        "label": "unknown",
        "probability": 0.0
    }

    inference_time = time.time() - start_time

    if prediction["probability"] < CONFIDENCE_THRESHOLD:
        return {
            "label": "needs_expert_review",
            "confidence": prediction["probability"],
            "inference_time": inference_time
        }

    return {
        "label": prediction["label"],
        "confidence": prediction["probability"],
        "inference_time": inference_time
    }

