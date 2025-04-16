import {
  buffer,
  centroid,
  distance as turfDistance,
  nearestPointOnLine,
  point,
  booleanIntersects,
} from "@turf/turf";
import type {
  Feature,
  Polygon,
  MultiPolygon,
  GeoJsonProperties,
} from "geojson";
import { MapGeoJSONFeature, MapInstance } from "react-map-gl/maplibre";

type ParcelleFeature = Feature<Polygon | MultiPolygon, GeoJsonProperties>;

export const getRiskFromScore = (score: number) => {
  if (score > 8) return 3;
  if (score > 6) return 2;
  if (score > 3) return 1;
  return 0;
};

const turfDistanceToBorder = (
  centerPoint: GeoJSON.Feature<GeoJSON.Point>,
  polygonFeature: GeoJSON.Feature
): number => {
  const coords =
    polygonFeature.geometry.type === "Polygon"
      ? polygonFeature.geometry.coordinates
      : polygonFeature.geometry.type === "MultiPolygon"
      ? polygonFeature.geometry.coordinates.flat()
      : [];

  const allLineStrings = coords.map((ring) => ({
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: ring,
    },
    properties: {},
  }));

  const distances = allLineStrings.map((line) => {
    const nearest = nearestPointOnLine(line, centerPoint);
    return turfDistance(centerPoint, nearest, { units: "meters" });
  });

  return Math.min(...distances);
};

export const getNearbySiblings = (
  centerFeature: MapGeoJSONFeature,
  siblings: MapGeoJSONFeature[],
  maxDistanceMeters: number
): MapGeoJSONFeature[] => {
  if (!centerFeature) return [];

  const buffered = buffer(centerFeature, maxDistanceMeters, {
    units: "meters",
  });

  if (!buffered) return [];

  const center = centroid(centerFeature);

  const centerPoint = point(center.geometry.coordinates);

  const nearby = siblings
    .filter((sibling): sibling is MapGeoJSONFeature => {
      if (!sibling) return false;
      return booleanIntersects(buffered, sibling);
    })
    .sort((a, b) => {
      const da = turfDistanceToBorder(centerPoint, a);
      const db = turfDistanceToBorder(centerPoint, b);
      return da - db;
    });

  return nearby;
};

export const updateFeatureState = (
  map: MapInstance,
  id: string | number,
  state: Record<string, any>
) => {
  map.setFeatureState(
    {
      source: "cadastre",
      sourceLayer: "parcelles",
      id,
    },
    state
  );
};
