export function captureMapImage(maxWidth = 600, quality = 0.9): string | null {
  try {
    const canvas =
      document.querySelector<HTMLCanvasElement>(".maplibregl-canvas") ??
      document.querySelector<HTMLCanvasElement>("#map canvas");

    if (!canvas) {
      console.warn("[captureMapImage] map canvas (.maplibregl-canvas) not found");
      return null;
    }
    if (canvas.width === 0 || canvas.height === 0) {
      console.warn("[captureMapImage] map canvas has zero dimensions", {
        width: canvas.width,
        height: canvas.height,
      });
      return null;
    }

    const scale = Math.min(1, maxWidth / canvas.width);
    const width = Math.max(1, Math.round(canvas.width * scale));
    const height = Math.max(1, Math.round(canvas.height * scale));

    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const ctx = off.getContext("2d");
    if (!ctx) {
      console.warn("[captureMapImage] could not get 2d context");
      return null;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(canvas, 0, 0, width, height);

    const dataUrl = off.toDataURL("image/jpeg", quality);
    if (!dataUrl.startsWith("data:image/jpeg")) {
      console.warn("[captureMapImage] toDataURL did not return a JPEG", {
        prefix: dataUrl.slice(0, 32),
      });
      return null;
    }
    return dataUrl;
  } catch (err) {
    console.warn(
      "[captureMapImage] capture failed (canvas may be tainted by cross-origin tiles, or preserveDrawingBuffer is off):",
      err,
    );
    return null;
  }
}
