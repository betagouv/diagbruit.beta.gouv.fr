"""
Version configuration for the FastAPI application
"""

__version__ = "0.7.0"

def get_api_version() -> str:
    """Get the current API version"""
    return __version__