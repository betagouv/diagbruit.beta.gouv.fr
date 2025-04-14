from pydantic import BaseModel
from typing import Optional, Any, Dict

# Schema for displaying a noise map item
class NoiseMapItem(BaseModel):
    pk: int
    idzonbruit: str
    idcbs: str
    uueid: Optional[str] = None
    annee: Optional[str] = None
    codedept: Optional[str] = None
    typeterr: Optional[str] = None
    producteur: Optional[str] = None
    codeinfra: Optional[str] = None
    typesource: Optional[str] = None
    cbstype: Optional[str] = None
    zonedef: Optional[str] = None
    legende: Optional[str] = None
    indicetype: Optional[str] = None
    validedeb: Optional[str] = None
    validefin: Optional[str] = None
    
    class Config:
        orm_mode = True

# Schema for GeoJSON output
class NoiseMapGeoJSON(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: NoiseMapItem
    
    class Config:
        orm_mode = True