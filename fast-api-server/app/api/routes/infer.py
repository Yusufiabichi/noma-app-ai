from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from app.schemas.response import InferenceResponse
from app.services.preprocess import preprocess_image
from app.services.inference import run_inference
from app.services.postprocess import postprocess_result
import uuid

router = APIRouter()

@router.post("/infer", response_model=InferenceResponse)
async def run_ai_inference(
    crop_type: str = Form(...),
    image_file: UploadFile = File(...),
   
):
    # Auto-generate scan_id if not provided
    
    scan_id = str(uuid.uuid4())
    
    try:
        image_tensor = await preprocess_image(image_file)
        result = run_inference(crop_type, image_tensor)

        postprocessed = postprocess_result(
            result["label"],
            result["confidence"],
            
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return InferenceResponse(
        scan_id=scan_id,
        disease=result["label"],
        confidence=result["confidence"],
        severity=result["severity"],
        recommendation=result["recommendation"]
    )
