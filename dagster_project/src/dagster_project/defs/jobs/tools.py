import hashlib

from datetime import datetime, timezone


def manifest_file(input_dir:str):
    sha256 = {
        file.name: hashlib.sha256(file.read_bytes()).hexdigest()
        for file in input_dir.rglob("*")
        if file.is_file()
    }

    manifest = {
        "provenance": "test",
        "pulled_at": datetime.now(timezone.utc).isoformat(),
        "sha256": sha256,
    }

    return manifest