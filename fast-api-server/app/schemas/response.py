from pydantic import BaseModel, Field
from typing import Optional

class InferenceResponse(BaseModel):
    scan_id: str = Field(description="Unique scan identifier")
    disease: str
    confidence: float
    severity: str
    recommendation: str