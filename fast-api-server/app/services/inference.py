from fastapi import APIRouter, HTTPException
from app.schemas.request import InferenceRequest
from app.schemas.response import InferenceResponse
from app.services.preprocess import preprocess_image
from app.models.loader import get_model
from app.services.postprocess import postprocess_result
import time
import numpy as np
import tensorflow as tf


router = APIRouter()

CLASS_NAMES = ['Maize_Blight', 'Maize_Common_Rust', 'Maize_Gray_Leaf_Spot',
                'Maize_Healthy', 'Rice_Bacterial_leaf_blight',
                  'Rice_Brown_spot', 'Rice_Leaf_smut',
                    'bean_angular_leaf_spot', 
                    'bean_healthy', 'bean_rust']

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
        severity=result["severity"],
        recommendation=result["recommendation"]
    )



CONFIDENCE_THRESHOLD = 0.5

def run_inference(crop_type: str, image_tensor):
    start_time = time.time()

    model_entry = get_model(crop_type)
    model = model_entry["model"]

    predictions = model.predict(image_tensor)

    predicted_class = CLASS_NAMES[np.argmax(predictions[0])]
    confidence = np.max(predictions[0])
    
    inference_time = time.time() - start_time

    postprocess_output = postprocess_result(predicted_class, confidence)

    return {
        "label": predicted_class,
        "confidence": confidence,
        "inference_time": inference_time,
        "disease": postprocess_output["disease"],
        "severity": postprocess_output["severity"],
        "recommendation": postprocess_output["recommendation"]
    }

