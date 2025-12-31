from pydantic import BaseModel, HttpUrl, Field

class InferenceRequest(BaseModel):
    scan_id: str = Field(..., description="Unique scan identifier")
    image_url: HttpUrl = Field(..., description="Image storage URL or key")
    crop_type: str = Field(..., description="Crop type eg maize rice cassava")