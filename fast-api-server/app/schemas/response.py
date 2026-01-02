from pydantic import BaseModel

class InferenceResponse(BaseModel):
    scan_id: int
    disease: str
    confidence: float
    severity: str
    recommendation: str