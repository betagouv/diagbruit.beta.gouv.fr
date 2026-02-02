import asyncio
import copy
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Union
from app.database import SessionLocal
from app.utils import (
    create_multipolygon_from_coordinates,
    get_parcelle_coordinates,
    is_code_insee_allowed
)
from app.utils.db import (
    query_noisemap_intersecting_features,
    query_noisesource_intersecting_features,
    query_soundclassification_intersecting_features,
    query_peb_intersecting_features,
    upsert_diagnostic_result
)
from app.algorithm import get_parcelle_diagnostic
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)


class Populate(BaseModel):
    zones: bool = Field(False, example=False)
    isolation: bool = Field(False, example=False)


class ParcelleRequest(BaseModel):
    code_insee: str = Field(..., example="33063")
    section: str = Field(..., example="CE")
    numero: str = Field(..., example="0019")

class SingleParcelleRequest(BaseModel):
    parcelle: ParcelleRequest
    populate: Populate

class MultiParcelleRequest(BaseModel):
    parcelles: List[SingleParcelleRequest]


class GeometryItem(BaseModel):
    parcelle: ParcelleRequest
    populate: Populate
    geometry: Union[
        List[List[List[float]]],
        List[List[List[List[float]]]]
    ] = Field(
        ...,
        example=[
            [
                [-0.5728407204151154, 44.81337741494815],
                [-0.5728380382061005, 44.813359338576106],
                [-0.572836697101593, 44.81334601914048],
                [-0.5728340148925781, 44.81332794275863],
                [-0.572824627161026, 44.813234706593846],
                [-0.5728983879089355, 44.81323090103291],
                [-0.5729882419109344, 44.81322519269099],
                [-0.5731800198554993, 44.81321472739606],
                [-0.573188066482544, 44.81321663017712],
                [-0.5731920897960663, 44.81322138712943],
                [-0.5731920897960663, 44.81322614408137],
                [-0.5731411278247833, 44.81333935942152],
                [-0.5730418860912323, 44.813352678858706],
                [-0.5730016529560089, 44.81335743579979],
                [-0.5729909241199493, 44.81335838718795],
                [-0.5729842185974121, 44.81336504690475],
                [-0.5729842185974121, 44.81336980384481],
                [-0.5729144811630249, 44.81337360939662],
                [-0.5728407204151154, 44.81337741494815]
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

async def process_parcelle(parcelle: ParcelleRequest, populate: Populate):
    try:
        coordinates = await get_parcelle_coordinates(
            code_insee=parcelle.code_insee,
            section=parcelle.section,
            numero=parcelle.numero
        )
        return {"parcelle": parcelle, "coordinates": coordinates, "populate": populate}
    except HTTPException as e:
        return {"parcelle": parcelle, "error": {"status_code": e.status_code, "detail": e.detail}}
    except Exception as e:
        return {"parcelle": parcelle, "error": {"status_code": 500, "detail": str(e)}}


def _generate_diagnostic_threaded(polygon_wkt: str, codedept: str, populate: Populate):
    db = SessionLocal()
    try:
        noisemap = query_noisemap_intersecting_features(db, polygon_wkt, codedept)
        noisesource = query_noisesource_intersecting_features(db, polygon_wkt)
        percent_unimpacted = noisemap.get("percent_unimpacted", 0)
        sound = query_soundclassification_intersecting_features(db, polygon_wkt, populate.isolation, codedept)
        peb = query_peb_intersecting_features(db, polygon_wkt)
        return get_parcelle_diagnostic(
            noisemap.get('intersections', []),
            sound.get('intersections', []),
            peb.get('intersections', []),
            noisesource.get('intersections', []),
            percent_unimpacted,
            populate
        )
    finally:
        db.close()


async def generate_diagnostic_async(polygon_wkt: str, codedept: str, populate: Populate):
    loop = asyncio.get_running_loop()
    diagnostic = await loop.run_in_executor(executor, _generate_diagnostic_threaded, polygon_wkt, codedept, populate)
    return copy.deepcopy(diagnostic)


@router.post("/generate/from-parcelles")
async def generate_diag_from_parcelles(
    request: MultiParcelleRequest
):
    results = await asyncio.gather(*(process_parcelle(p.parcelle, p.populate) for p in request.parcelles))

    async def process_result(result):
        if "error" in result:
            return {
                "parcelle": result["parcelle"].dict(),
                "error": result["error"]
            }

        if not is_code_insee_allowed(result['parcelle'].code_insee):
            raise HTTPException(
                status_code=404,
                detail=f"La parcelle {result['parcelle'].dict()} ne fait pas parti des données intégrées"
            )

        try:
            print(result)
            populate = result["populate"]
            polygone = create_multipolygon_from_coordinates(result["coordinates"])
            codedept = f"0{result['parcelle'].code_insee[:2]}"

            diagnostic = await generate_diagnostic_async(polygone, codedept, populate)

            asyncio.create_task(upsert_diagnostic_result(
                code_insee=result['parcelle'].code_insee,
                section=result['parcelle'].section,
                numero=result['parcelle'].numero,
                geometry=result["coordinates"],
                score=diagnostic['score'],
                diagnostic_result=diagnostic
            ))

            return {
                "parcelle": {**result["parcelle"].dict(), "geometry": result["coordinates"]},
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
        if not is_code_insee_allowed(item.parcelle.code_insee):
            raise HTTPException(
                status_code=404,
                detail=f"La parcelle {item.parcelle.dict()} ne fait pas parti des données intégrées"
            )

        try:
            populate = item.populate
            polygone = create_multipolygon_from_coordinates(item.geometry)
            codedept = f"0{item.parcelle.code_insee[:2]}"
            diagnostic = await generate_diagnostic_async(polygone, codedept, populate)
            
            asyncio.create_task(upsert_diagnostic_result(
                code_insee=item.parcelle.code_insee,
                section=item.parcelle.section,
                numero=item.parcelle.numero,
                geometry=item.geometry,
                score=diagnostic['score'],
                diagnostic_result=diagnostic
            ))
            
            return {"parcelle": {**dict(item.parcelle), "geometry": item.geometry}, "diagnostic": diagnostic}
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
