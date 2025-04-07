import httpx
from fastapi import HTTPException
from typing import List


async def get_parcelle_coordinates(code_insee: str, section: str, numero: str) -> List:
    """
    Interroge l'API Cadastre IGN pour récupérer les coordonnées d'une parcelle.

    Args:
        code_insee: Code INSEE de la commune (5 caractères)
        section: Code section cadastrale (2 caractères)
        numero: Numéro de la parcelle (4 caractères)

    Returns:
        Liste des coordonnées GeoJSON (MultiPolygon)
    """
    url = "https://apicarto.ign.fr/api/cadastre/parcelle"
    params = {
        "code_insee": code_insee,
        "section": section,
        "numero": numero
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        features = data.get("features", [])
        if not features:
            raise HTTPException(status_code=404, detail="Aucune parcelle trouvée avec ces identifiants")

        return features[0]["geometry"]["coordinates"]

    except HTTPException as e:
        raise e
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Erreur API IGN : {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne : {e}")
