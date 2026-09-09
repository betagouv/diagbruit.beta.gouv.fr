import { computeOptimalZone } from "../hooks/useOptimalZone";
import { getProjectionUtils, smoothPolygon } from "./draw";
import {
  getColorFromRisk,
  mergeRings,
  normalizeToRings,
  transparentize,
} from "./tools";
import type { Geometry, Zone } from "./types";

export type PositionData = {
  size: number;
  parcellePoints: string[];
  zones: { d: string; fill: string }[];
  optimalPoints: { x: number; y: number }[];
};

const BOX = 400;
const PADDING = 10;

export const buildPositionData = (
  geometry: Geometry,
  zones: Zone[],
): PositionData | undefined => {
  const rings = mergeRings(normalizeToRings(geometry));
  if (!rings.length || rings.some((r) => !Array.isArray(r))) return undefined;

  const { projectPoint, projectRing } = getProjectionUtils(
    rings,
    BOX,
    BOX,
    PADDING,
  );

  const parcellePoints = rings.map((ring) => projectRing(ring));

  const zonePaths = [...zones]
    .sort((a, b) => a.risk - b.risk)
    .flatMap((zone) => {
      const fill = transparentize(getColorFromRisk(zone.risk), 0.8, false);
      return normalizeToRings(zone.geometry).map((ring) => ({
        d: smoothPolygon(ring.map(projectPoint)),
        fill,
      }));
    })
    .filter((z) => z.d.length > 0);

  const { optimalZonePoints } = computeOptimalZone({
    rings,
    zones,
    projectPoint,
    width: BOX,
    height: BOX,
    safeZoneThreshold: 0.1,
    radiusPercent: 0.4,
  });

  const round = (n: number) => Math.round(n * 10) / 10;
  const optimalPoints = optimalZonePoints.map((p) => ({
    x: round(p.x),
    y: round(p.y),
  }));

  return { size: BOX, parcellePoints, zones: zonePaths, optimalPoints };
};
