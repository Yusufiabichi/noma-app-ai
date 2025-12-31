from pydantic import BaseModel

class InferenceResponse(BaseModel):
    scan_id: str
    disease: str
    confidence: float
    severity: str
    recommendation: str