from pydantic import BaseModel, Field

class InferenceRequest(BaseModel):
    scan_id: str = Field(..., description="Unique scan identifier")
    crop_type: str = Field(..., description="Crop type eg maize rice cassava")