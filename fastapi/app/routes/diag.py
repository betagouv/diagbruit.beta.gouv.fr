import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List
from app.database import get_db
from app.utils import (
    create_multipolygon_from_coordinates,
    query_noisemap_intersecting_features,
    query_soundclassification_intersecting_features,
    get_parcelle_coordinates,
    get_parcelle_score
)

class ParcelleRequest(BaseModel):
    code_insee: str = Field(..., example="33063")
    section: str = Field(..., example="CE")
    numero: str = Field(..., example="0019")

class MultiParcelleRequest(BaseModel):
    parcelles: List[ParcelleRequest]

router = APIRouter(
    prefix="/diag",
    tags=["diag"],
    responses={404: {"description": "Not found"}},
)

async def process_parcelle(parcelle: ParcelleRequest):
    try:
        coordinates = await get_parcelle_coordinates(
            code_insee=parcelle.code_insee,
            section=parcelle.section,
            numero=parcelle.numero
        )
        return {"parcelle": parcelle, "coordinates": coordinates}
    except HTTPException as e:
        return {"parcelle": parcelle, "error": {"status_code": e.status_code, "detail": e.detail}}
    except Exception as e:
        return {"parcelle": parcelle, "error": {"status_code": 500, "detail": str(e)}}

@router.post("/generate")
async def generate_diag(
    request: MultiParcelleRequest,
    db: Session = Depends(get_db)
):
    # Async API calls to get coordinates for each parcel
    results = await asyncio.gather(
        *(process_parcelle(p) for p in request.parcelles)
    )

    diagnostics = []
    for result in results:
        if "error" in result:
            diagnostics.append({
                "parcelle": result["parcelle"].dict(),
                "error": result["error"]
            })
            continue

        try:
            polygone = create_multipolygon_from_coordinates(result["coordinates"])
            noisemap_intersections = query_noisemap_intersecting_features(db, polygone)
            soundclassification_intersections = query_soundclassification_intersecting_features(db, polygone)
            score = get_parcelle_score(noisemap_intersections, soundclassification_intersections)

            print(soundclassification_intersections)

            diagnostics.append({
                "parcelle": result["parcelle"].dict(),
                "score": score,
            })
        except Exception as e:
            diagnostics.append({
                "parcelle": result["parcelle"].dict(),
                "error": {
                    "status_code": 500,
                    "detail": str(e)
                }
            })

    return {"diagnostics": diagnostics}
