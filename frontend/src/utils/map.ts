import {
  booleanIntersects,
  buffer,
  centroid,
  nearestPointOnLine,
  point,
  distance as turfDistance,
} from "@turf/turf";
import union from "@turf/union";
import { Feature, GeoJsonProperties, MultiPolygon, Polygon } from "geojson";
import { MapGeoJSONFeature, MapInstance } from "react-map-gl/maplibre";

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

export function mergeCoordinatesByParcelle(
  siblings: MapGeoJSONFeature[]
): MapGeoJSONFeature[] {
  const grouped: Record<string, MapGeoJSONFeature[]> = {};

  for (const feature of siblings) {
    const { commune, section, numero } = feature.properties;
    const key = `${commune}-${section}-${numero}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(feature);
  }

  const result: MapGeoJSONFeature[] = [];

  for (const group of Object.values(grouped)) {
    if (group.length === 1) {
      result.push(group[0]);
      continue;
    }

    const base = group[0];
    const allCoords = group.flatMap((f) => {
      if (f.geometry.type === "Polygon") {
        return [f.geometry.coordinates];
      } else if (f.geometry.type === "MultiPolygon") {
        return f.geometry.coordinates;
      } else {
        console.warn("Unsupported geometry type:", f.geometry.type);
        return [];
      }
    });

    const mergedGeometry: MultiPolygon = {
      type: "MultiPolygon",
      coordinates: allCoords,
    };

    const mergedFeature: MapGeoJSONFeature = {
      ...base,
      geometry: mergedGeometry,
      id: `${base.id}`,
      properties: {
        ...base.properties,
        merged: true,
      },
      toJSON: base.toJSON,
    };

    result.push(mergedFeature);
  }

  return result;
}
