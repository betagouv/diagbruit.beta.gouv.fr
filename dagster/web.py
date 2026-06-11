"""Production entry point for the Dagster webserver with HTTP Basic Auth.

Intercepts uvicorn.run (called internally by dagster-webserver) to wrap the
ASGI app with a basic auth middleware before it starts serving.

Required env vars:
    DAGSTER_WEB_USER      — login username
    DAGSTER_WEB_PASSWORD  — login password
    PORT                  — port to bind (set automatically by Scalingo)
"""

import base64
import os
import sys

import uvicorn
from dotenv import load_dotenv
from starlette.responses import Response

load_dotenv()

_USER = os.environ["DAGSTER_WEB_USER"]
_PASSWORD = os.environ["DAGSTER_WEB_PASSWORD"]


def _check_basic_auth(auth_header: bytes) -> bool:
    try:
        scheme, credentials = auth_header.split(b" ", 1)
        if scheme.lower() != b"basic":
            return False
        user, pwd = base64.b64decode(credentials).decode().split(":", 1)
        return user == _USER and pwd == _PASSWORD
    except Exception:
        return False


class BasicAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            headers = dict(scope.get("headers", []))
            if not _check_basic_auth(headers.get(b"authorization", b"")):
                response = Response(
                    "Unauthorized",
                    status_code=401,
                    headers={"WWW-Authenticate": 'Basic realm="Dagster"'},
                )
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)


_original_uvicorn_run = uvicorn.run


def _run_with_auth(app, **kwargs):
    _original_uvicorn_run(BasicAuthMiddleware(app), **kwargs)


uvicorn.run = _run_with_auth

from dagster_webserver.cli import main

sys.argv = [
    "dagster-webserver",
    "-m", "dagster_project.definitions",
    "-h", "0.0.0.0",
    "-p", os.environ.get("PORT", "3001"),
]
main()
