import hashlib
import time
from datetime import datetime, timezone
from pathlib import Path

from dagster import AssetExecutionContext


def reporthook(
    block_count: int,
    block_size: int,
    total_size: int,
    context: AssetExecutionContext,
    start_time: float,
    last_log_time: list[float],
) -> None:
    """Throttle-logged download progress hook (2 second cadence)."""
    now = time.time()
    if now - last_log_time[0] < 2:
        return
    last_log_time[0] = now

    downloaded = block_count * block_size
    elapsed = now - start_time
    speed_mb = (downloaded / elapsed) / (1024 * 1024) if elapsed > 0 else 0

    if total_size > 0:
        percent = min(downloaded / total_size * 100, 100)
        context.log.info(f"Downloading... {percent:.1f}% — {speed_mb:.2f} MB/s")
    else:
        context.log.info(f"Downloading... {downloaded / (1024 * 1024):.1f} MB — {speed_mb:.2f} MB/s")


def sha256_file(path: Path, block_size: int = 1024 * 1024) -> str:
    """Hash a file incrementally — `read_bytes()` on a 500 MB shapefile OOMs a container."""
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        while block := handle.read(block_size):
            digest.update(block)
    return digest.hexdigest()


def manifest_file(input_dir: Path) -> dict:
    """Build a sha256 manifest for every file under `input_dir`."""
    sha256 = {
        str(file.relative_to(input_dir)): sha256_file(file)
        for file in input_dir.rglob("*")
        if file.is_file()
    }

    return {
        "provenance": "test",
        "pulled_at": datetime.now(timezone.utc).isoformat(),
        "sha256": sha256,
    }
