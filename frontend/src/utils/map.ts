import { distance as turfDistance, centroid } from "@turf/turf";
import { MapGeoJSONFeature } from "react-map-gl/maplibre";

export const getRiskFromScore = (score: number) => {
  if (score > 8) return 3;
  if (score > 6) return 2;
  if (score > 3) return 1;
  return 0;
};

export const getNearbySiblings = (
  centerFeature: MapGeoJSONFeature,
  siblings: MapGeoJSONFeature[],
  maxDistanceMeters: number
): MapGeoJSONFeature[] => {
  const center = centroid(centerFeature);

  const nearby = siblings.filter((sibling) => {
    const siblingCenter = centroid(sibling);
    const dist = turfDistance(center, siblingCenter, { units: "meters" });
    return dist <= maxDistanceMeters;
  });

  nearby.sort((a, b) => {
    const da = turfDistance(center, centroid(a), { units: "meters" });
    const db = turfDistance(center, centroid(b), { units: "meters" });
    return da - db;
  });

  return nearby;
};
