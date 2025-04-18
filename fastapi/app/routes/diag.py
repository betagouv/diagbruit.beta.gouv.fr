import asyncio
import copy
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Union
from app.database import SessionLocal
from app.utils import (
    create_multipolygon_from_coordinates,
    query_noisemap_intersecting_features,
    query_soundclassification_intersecting_features,
    query_peb_intersecting_features,
    get_parcelle_coordinates
)
from app.algorithm import get_parcelle_diagnostic
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)


class ParcelleRequest(BaseModel):
    code_insee: str = Field(..., example="33063")
    section: str = Field(..., example="CE")
    numero: str = Field(..., example="0019")


class MultiParcelleRequest(BaseModel):
    parcelles: List[ParcelleRequest]


class GeometryItem(BaseModel):
    parcelle: ParcelleRequest
    geometry: Union[
        List[List[List[float]]],
        List[List[List[List[float]]]]
    ] = Field(
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


def _generate_diagnostic_threaded(polygon_wkt: str):
    db = SessionLocal()
    try:
        noisemap = query_noisemap_intersecting_features(db, polygon_wkt)
        sound = query_soundclassification_intersecting_features(db, polygon_wkt)
        peb = query_peb_intersecting_features(db, polygon_wkt)
        return get_parcelle_diagnostic(noisemap, sound, peb)
    finally:
        db.close()


async def generate_diagnostic_async(polygon_wkt: str):
    loop = asyncio.get_running_loop()
    diagnostic = await loop.run_in_executor(executor, _generate_diagnostic_threaded, polygon_wkt)
    return copy.deepcopy(diagnostic)


@router.post("/generate/from-parcelles")
async def generate_diag_from_parcelles(
    request: MultiParcelleRequest
):
    results = await asyncio.gather(*(process_parcelle(p) for p in request.parcelles))

    async def process_result(result):
        if "error" in result:
            return {
                "parcelle": result["parcelle"].dict(),
                "error": result["error"]
            }

        try:
            polygone = create_multipolygon_from_coordinates(result["coordinates"])
            diagnostic = await generate_diagnostic_async(polygone)

            return {
                "parcelle": result["parcelle"].dict(),
                "diagnostic": diagnostic
            }
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erreur diagnostic pour parcelle {result['parcelle'].dict()}: {str(e)}"
            )

    try:
        diagnostics = await asyncio.gather(*(process_result(r) for r in results))
        return {"diagnostics": diagnostics}
    except HTTPException as e:
        raise e


@router.post("/generate/from-geometries")
async def generate_diag_from_geometry(
    request: GeometryRequest
):
    async def process_item(item: GeometryItem):
        try:
            polygone = create_multipolygon_from_coordinates(item.geometry)
            diagnostic = await generate_diagnostic_async(polygone)
            return {"parcelle": item.parcelle, "diagnostic": diagnostic}
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erreur diagnostic pour parcelle {item.parcelle.dict()}: {str(e)}"
            )

    try:
        diagnostics = await asyncio.gather(*(process_item(item) for item in request.items))
        return {"diagnostics": diagnostics}
    except HTTPException as e:
        raise e
