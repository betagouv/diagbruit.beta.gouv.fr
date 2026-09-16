import inside from "point-in-polygon";
import { useMemo } from "react";
import { normalizeToRings } from "../utils/tools";
import type { Zone } from "../utils/types";

type ProjectedPoint = { x: number; y: number };
type UseOptimalZoneOptions = {
  rings: [number, number][][];
  zones: Zone[];
  projectPoint: (pt: [number, number]) => ProjectedPoint;
  width: number;
  height: number;
  safeZoneThreshold?: number;
  radiusPercent?: number;
};

export function computeOptimalZone({
  rings,
  zones,
  projectPoint,
  width,
  height,
  safeZoneThreshold = 0.1,
  radiusPercent = 0.33,
}: UseOptimalZoneOptions) {
  const step = 10;

  {
    const grid: ProjectedPoint[] = [];
    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < height; y += step) {
        grid.push({ x, y });
      }
    }

    const mainPolygon = rings[0].map(projectPoint);
    const rawPolygon: [number, number][] = mainPolygon.map(({ x, y }) => [
      x,
      y,
    ]);

    const insidePoints = grid.filter((pt) => inside([pt.x, pt.y], rawPolygon));

    const zonePixels = zones.flatMap((zone) =>
      normalizeToRings(zone.geometry).map((ring) => ({
        risk: zone.risk,
        ring: ring.map(projectPoint),
      }))
    );

    const sortedByDb = [...new Set(zones.map((i) => i.risk))].sort(
      (a, b) => a - b
    );
    const minRisk = sortedByDb[0] ?? 0;
    const maxRisk = sortedByDb.at(-1) ?? 100;

    const pointInfos = insidePoints.map((pt) => {
      let minLegende: number | null = null;
      const rings = zonePixels.filter(({ ring }) =>
        inside(
          [pt.x, pt.y],
          ring.map(({ x, y }) => [x, y] as [number, number])
        )
      );
      if (rings.length > 0) {
        minLegende = Math.min(...rings.map((r) => r.risk));
      }
      return { ...pt, legende: minLegende };
    });

    const safePoints = pointInfos.filter((pt) => pt.legende === null);

    const distanceToContour = (pt: ProjectedPoint) => {
      const allContours = zonePixels.flatMap(({ ring }) => ring);
      return Math.min(
        ...allContours.map((c) => Math.hypot(c.x - pt.x, c.y - pt.y))
      );
    };

    let bestPoint: ProjectedPoint & { dist: number };

    const safeRatio = safePoints.length / insidePoints.length;
    if (safePoints.length > 0 && safeRatio > safeZoneThreshold) {
      bestPoint = safePoints.reduce(
        (best, pt) => {
          const d = distanceToContour(pt);
          return d > best.dist ? { ...pt, dist: d } : best;
        },
        { x: 0, y: 0, dist: -Infinity }
      );
    } else {
      const minNoisePoints = pointInfos.filter((pt) => pt.legende === minRisk);
      const loudContours = zonePixels
        .filter((i) => i.risk === maxRisk)
        .flatMap(({ ring }) => ring);

      bestPoint = minNoisePoints.reduce(
        (best, pt) => {
          const d = Math.min(
            ...loudContours.map((c) => Math.hypot(c.x - pt.x, c.y - pt.y))
          );
          return d > best.dist ? { ...pt, dist: d } : best;
        },
        { x: 0, y: 0, dist: -Infinity }
      );
    }

    const scored = insidePoints.map((pt) => ({
      ...pt,
      dist: Math.hypot(pt.x - bestPoint.x, pt.y - bestPoint.y),
    }));
    scored.sort((a, b) => a.dist - b.dist);

    const count = Math.floor(scored.length * radiusPercent);
    const optimalZonePoints = scored.slice(0, count);

    return { bestPoint, optimalZonePoints };
  }
}

export function useOptimalZone(options: UseOptimalZoneOptions) {
  const {
    rings,
    zones,
    projectPoint,
    width,
    height,
    safeZoneThreshold,
    radiusPercent,
  } = options;
  return useMemo(
    () => computeOptimalZone(options),
    [
      rings,
      zones,
      projectPoint,
      width,
      height,
      safeZoneThreshold,
      radiusPercent,
    ],
  );
}
