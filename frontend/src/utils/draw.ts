import { line as d3line, curveCardinalClosed } from "d3-shape";

export const getProjectionUtils = (
  rings: [number, number][][],
  width: number,
  height: number,
  padding = 10
) => {
  const allPoints = rings.flat();
  const lons = allPoints.map(([lon]) => lon);
  const lats = allPoints.map(([, lat]) => lat);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const geoWidth = Math.max(maxLon - minLon, 1e-6);
  const geoHeight = Math.max(maxLat - minLat, 1e-6);

  const drawableWidth = Math.max(width - 2 * padding, 1);
  const initialScale = drawableWidth / geoWidth;
  const rawHeight = geoHeight * initialScale + 2 * padding;
  const effectiveScale =
    rawHeight > height ? (height - 2 * padding) / geoHeight : initialScale;

  const offsetX = (width - geoWidth * effectiveScale) / 2;
  const offsetY = (height - geoHeight * effectiveScale) / 2;

  const projectPoint = ([lon, lat]: [number, number]) => {
    const x = (lon - minLon) * effectiveScale + offsetX;
    const y = (maxLat - lat) * effectiveScale + offsetY;
    return { x, y };
  };

  const projectRing = (ring: [number, number][]) =>
    ring
      .map(([lon, lat]) => {
        const x = (lon - minLon) * effectiveScale + offsetX;
        const y = (maxLat - lat) * effectiveScale + offsetY;
        return `${x},${y}`;
      })
      .join(" ");

  return {
    projectPoint,
    projectRing,
  };
};

export const smoothPolygon = (
  points: { x: number; y: number }[],
  tension = 0.7
): string => {
  const lineGenerator = d3line<{ x: number; y: number }>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(curveCardinalClosed.tension(tension));

  return lineGenerator(points) ?? "";
};
