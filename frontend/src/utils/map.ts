import {
  booleanIntersects,
  buffer,
  centroid,
  nearestPointOnLine,
  point,
  distance as turfDistance,
} from "@turf/turf";
import { MultiPolygon } from "geojson";
import { MapGeoJSONFeature, MapInstance } from "react-map-gl/maplibre";

const removeConsecutiveDuplicates = (
  ring: GeoJSON.Position[]
): GeoJSON.Position[] =>
  ring.filter(
    (p, i) => i === 0 || p[0] !== ring[i - 1][0] || p[1] !== ring[i - 1][1]
  );

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

  const allLineStrings = coords
    .map(removeConsecutiveDuplicates)
    .filter((ring) => ring.length >= 2)
    .map((ring) => ({
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
    .map((feature) => ({
      feature,
      distance: turfDistanceToBorder(centerPoint, feature),
    }))
    .sort((a, b) => {
      const aFinite = Number.isFinite(a.distance);
      const bFinite = Number.isFinite(b.distance);
      if (aFinite && bFinite) return a.distance - b.distance;
      if (aFinite) return -1;
      if (bFinite) return 1;
      return 0;
    })
    .map(({ feature }) => feature);

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

export function computeParcelleSiblings(
  map: MapInstance,
  feature: MapGeoJSONFeature,
  distanceMeters: number = 1000
): { clickedParcelle: MapGeoJSONFeature; nearbySiblings: MapGeoJSONFeature[] } {
  const sameTiles = map.queryRenderedFeatures({
    layers: ["parcelles-fill"],
    filter: [
      "all",
      ["==", ["get", "commune"], feature.properties.commune],
      ["==", ["get", "prefixe"], feature.properties.prefixe],
      ["==", ["get", "section"], feature.properties.section],
      ["==", ["get", "numero"], feature.properties.numero],
    ],
  });
  const clickedParcelle = mergeCoordinatesByParcelle(sameTiles)[0];

  const siblings = map.queryRenderedFeatures({
    layers: ["parcelles-fill"],
    filter: [
      "all",
      ["==", ["get", "commune"], feature.properties.commune],
      ["==", ["get", "section"], feature.properties.section],
      ["!=", ["get", "numero"], feature.properties.numero],
    ],
  });

  const nearbySiblings = getNearbySiblings(
    clickedParcelle,
    mergeCoordinatesByParcelle(siblings),
    distanceMeters
  ).slice(0, 16);

  return {
    clickedParcelle,
    nearbySiblings,
  };
}

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

    const mergedFeature: unknown = {
      ...base,
      geometry: mergedGeometry,
      id: `${base.id}`,
      properties: {
        ...base.properties,
        merged: true,
      },
      toJSON: base.toJSON,
    };

    result.push(mergedFeature as MapGeoJSONFeature); 
  }

  return result;
}

export const findFeatureAsync = (
  map: MapInstance,
  idu: string
): Promise<MapGeoJSONFeature | null> => {
  const maxAttempts = 1500;
  let attempts = 0;

  return new Promise((resolve) => {
    const checkForFeature = () => {
      const features = map.queryRenderedFeatures({
        layers: ["parcelles-fill"],
        filter: ["==", ["get", "id"], idu],
      });

      if (features.length > 0) {
        resolve(features[0]);
      } else if (attempts < maxAttempts) {
        attempts++;
        requestAnimationFrame(checkForFeature);
      } else {
        console.warn("Timeout: parcelles-fill feature not found");
        resolve(null);
      }
    };

    requestAnimationFrame(checkForFeature);
  });
};
