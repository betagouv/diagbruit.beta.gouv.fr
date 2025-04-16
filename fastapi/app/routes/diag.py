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
    query_peb_intersecting_features,
    get_parcelle_coordinates
)
from app.algorithm import get_parcelle_diagnostic

class ParcelleRequest(BaseModel):
    code_insee: str = Field(..., example="33063")
    section: str = Field(..., example="CE")
    numero: str = Field(..., example="0019")

class MultiParcelleRequest(BaseModel):
    parcelles: List[ParcelleRequest]

class GeometryItem(BaseModel):
    parcelle: ParcelleRequest
    geometry: List[List[List[float]]] = Field(
        ...,
        example=[
            [
                [-0.5698205530643463, 44.83324087407553],
                [-0.5696944892406464, 44.833234216654404],
                [-0.5697052180767059, 44.83312294250169],
                [-0.5697119235992432, 44.83311913825338],
                [-0.5698326230049133, 44.83312769781176],
                [-0.5698259174823761, 44.83318856574596],
                [-0.5698232352733612, 44.83321519544694],
                [-0.5698205530643463, 44.83324087407553]
            ]
        ]
    )


class GeometryRequest(BaseModel):
    items: List[GeometryItem]

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

@router.post("/generate/from-parcelles")
async def generate_diag_from_parcelles(
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
            peb_intersections = query_peb_intersecting_features(db, polygone)

            diagnostic = get_parcelle_diagnostic(noisemap_intersections, soundclassification_intersections, peb_intersections)

            diagnostics.append({
                "parcelle": result["parcelle"].dict(),
                "diagnostic": diagnostic,
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


@router.post("/generate/from-geometries")
async def generate_diag_from_geometry(
    request: GeometryRequest,
    db: Session = Depends(get_db)
):
    diagnostics = []

    for item in request.items:
        # try:
        polygone = create_multipolygon_from_coordinates(item.geometry)

        noisemap_intersections = query_noisemap_intersecting_features(db, polygone)
        soundclassification_intersections = query_soundclassification_intersecting_features(db, polygone)
        peb_intersections = query_peb_intersecting_features(db, polygone)

        diagnostic = get_parcelle_diagnostic(
            noisemap_intersections,
            soundclassification_intersections,
            peb_intersections
        )
        diagnostics.append({
            "parcelle": item.parcelle,
            "diagnostic": diagnostic,
        })
        #
        # except Exception as e:
        #     diagnostics.append({
        #        "parcelle": item.parcelle,
        #         "error": {
        #             "status_code": 500,
        #             "detail": str(e)
        #         }
        #     })

    return {"diagnostics": diagnostics}
