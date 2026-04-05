from pydantic import BaseModel, Field

class InferenceRequest(BaseModel):
    crop_type: str = Field(..., description="Crop type eg maize rice cassava")