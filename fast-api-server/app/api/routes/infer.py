from fastapi import APIRouter
from app.schemas.request import InferenceRequest
from app.schemas.response import InferenceResponse

router = APIRouter()

@router.post("/infer", response_model=InferenceResponse)
def run_inference(request: InferenceRequest):
    return InferenceResponse(
        scan_id=request.scan_id,
        disease="Unknown",
        confidence=0.0,
        severity="unknown",
        recommendation="AI model not yet active"
    )