import inside from "point-in-polygon";
import { useMemo } from "react";
import { normalizeToRings } from "../utils/tools";
import { LandIntersection } from "../utils/types";

type ProjectedPoint = { x: number; y: number };
type UseOptimalZoneOptions = {
  rings: [number, number][][];
  intersections: LandIntersection[];
  projectPoint: (pt: [number, number]) => ProjectedPoint;
  width: number;
  height: number;
  safeZoneThreshold?: number;
  radiusPercent?: number;
};

export function useOptimalZone({
  rings,
  intersections,
  projectPoint,
  width,
  height,
  safeZoneThreshold = 0.1,
  radiusPercent = 0.33,
}: UseOptimalZoneOptions) {
  const step = 10;

  return useMemo(() => {
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

    const intersectionPixels = intersections.flatMap((intersection) =>
      normalizeToRings(intersection.geometry_intersection).map((ring) => ({
        legende: intersection.legende,
        ring: ring.map(projectPoint),
      }))
    );

    const sortedByDb = [...new Set(intersections.map((i) => i.legende))].sort(
      (a, b) => a - b
    );
    const minDb = sortedByDb[0] ?? 0;
    const maxDb = sortedByDb.at(-1) ?? 100;

    const pointInfos = insidePoints.map((pt) => {
      let minLegende: number | null = null;
      const rings = intersectionPixels.filter(({ ring }) =>
        inside(
          [pt.x, pt.y],
          ring.map(({ x, y }) => [x, y] as [number, number])
        )
      );
      if (rings.length > 0) {
        minLegende = Math.min(...rings.map((r) => r.legende));
      }
      return { ...pt, legende: minLegende };
    });

    const safePoints = pointInfos.filter((pt) => pt.legende === null);

    const distanceToContour = (pt: ProjectedPoint) => {
      const allContours = intersectionPixels.flatMap(({ ring }) => ring);
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
      const minNoisePoints = pointInfos.filter((pt) => pt.legende === minDb);
      const loudContours = intersectionPixels
        .filter((i) => i.legende === maxDb)
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
  }, [
    rings,
    intersections,
    projectPoint,
    width,
    height,
    safeZoneThreshold,
    radiusPercent,
  ]);
}
