import {
  buffer,
  booleanIntersects,
  centroid,
  distance as turfDistance,
} from "@turf/turf";
import type {
  Feature,
  Polygon,
  MultiPolygon,
  GeoJsonProperties,
} from "geojson";
import { MapGeoJSONFeature } from "react-map-gl/maplibre";

type ParcelleFeature = Feature<Polygon | MultiPolygon, GeoJsonProperties>;

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
  if (!centerFeature) return [];

  const buffered = buffer(centerFeature as ParcelleFeature, maxDistanceMeters, {
    units: "meters",
  });

  const center = centroid(centerFeature as ParcelleFeature);

  const nearby = siblings
    .filter((sibling): sibling is MapGeoJSONFeature => {
      if (!sibling) return false;
      return booleanIntersects(
        buffered as ParcelleFeature,
        sibling as ParcelleFeature
      );
    })
    .sort((a, b) => {
      const ca = centroid(a as ParcelleFeature);
      const cb = centroid(b as ParcelleFeature);
      const da = turfDistance(center, ca, { units: "meters" });
      const db = turfDistance(center, cb, { units: "meters" });
      return da - db;
    });

  return nearby;
};
