from pydantic import BaseModel
from typing import Optional, Any, Dict

# Schema for displaying a sound classification item
class SoundClassificationItem(BaseModel):
    pk: int
    source: Optional[str] = None
    kind: Optional[str] = None
    codeinfra: Optional[str] = None
    acoustic_buffer: Optional[float] = None
    acoustic_category: Optional[int] = None

    class Config:
        orm_mode = True

# Schema for GeoJSON output
class SoundClassificationGeoJSON(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: SoundClassificationItem

    class Config:
        orm_mode = True
