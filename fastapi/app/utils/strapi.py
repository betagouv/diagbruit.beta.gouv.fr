"""Shared helper for cached GET requests against the Strapi CMS.

All diagnostic-path Strapi reads (noise-source categories, noisezone alerts,
recommendations) resolve rarely-changing editorial content on every request.
This module fetches and caches that content process-wide with a short TTL so
edits in Strapi still propagate, while sparing Strapi a request per diagnostic.

The cache is read from the diagnostic ThreadPoolExecutor, so access is guarded
by a lock — TTLCache is not thread-safe. Only successful responses are cached;
transport/HTTP errors return None and are not cached, so they are retried on the
next call.
"""
import os
import time
import logging
import threading
from typing import Any, Dict, Optional

import httpx
from cachetools import TTLCache

logger = logging.getLogger(__name__)

_CACHE: "TTLCache[tuple, Any]" = TTLCache(maxsize=512, ttl=600)
_CACHE_LOCK = threading.Lock()
_CACHE_MISS = object()


def strapi_base_url() -> str:
    return os.getenv("STRAPI_URL", "http://localhost:1337")


def _cache_key(path: str, params: Optional[Dict[str, Any]]) -> tuple:
    return (path, tuple(sorted(params.items())) if params else ())


def cached_strapi_get(
    path: str,
    params: Optional[Dict[str, Any]] = None,
    *,
    timeout: float = 10.0,
    retries: int = 1,
    retry_delay: float = 0.5,
) -> Optional[Any]:
    """GET ``{STRAPI_URL}{path}`` and return the parsed JSON body.

    The result is cached process-wide keyed by ``(path, params)``. Returns
    ``None`` on transport/HTTP error after exhausting ``retries`` (errors are
    not cached). Callers are responsible for shaping the returned JSON.
    """
    key = _cache_key(path, params)
    with _CACHE_LOCK:
        cached = _CACHE.get(key, _CACHE_MISS)
    if cached is not _CACHE_MISS:
        return cached

    url = f"{strapi_base_url()}{path}"
    for attempt in range(1, retries + 1):
        try:
            response = httpx.get(url, params=params, timeout=timeout)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            logger.error(f"[attempt {attempt}/{retries}] Error fetching {url} from Strapi: {e}")
            if attempt < retries:
                time.sleep(retry_delay)
            continue
        with _CACHE_LOCK:
            _CACHE[key] = data
        return data

    return None
