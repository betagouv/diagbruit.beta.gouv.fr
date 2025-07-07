from fastapi import APIRouter
import jwt
import time
import os

router = APIRouter(
    prefix="/metabase",
    tags=["metabase"],
    responses={404: {"description": "Not found"}},
)

METABASE_SITE_URL = "https://metabase.diagbruit.fr"
METABASE_SECRET_KEY = os.getenv("METABASE_SECRET_KEY")

@router.get("/iframe/stats")
async def get_metabase_iframe_url():
    payload = {
        "resource": {"dashboard": 2},
        "params": {},
        "exp": round(time.time()) + (60 * 10)  # 10 minute expiration
    }

    token = jwt.encode(payload, METABASE_SECRET_KEY, algorithm="HS256")

    iframe_url = f"{METABASE_SITE_URL}/embed/dashboard/{token}#background=false&bordered=false&titled=false"

    return {"iframe_url": iframe_url}
