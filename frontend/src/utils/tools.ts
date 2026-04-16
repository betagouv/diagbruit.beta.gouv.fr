import { FrIconClassName, RiIconClassName } from "@codegouvfr/react-dsfr";
import area from "@turf/area";
import inside from "point-in-polygon";
import { union } from "polygon-clipping";
import {
  Cardinality,
  Diagnostic,
  DiagnosticItem,
  Geometry,
  IntRange,
  SoundClassificationIntersectionAffectedHelper,
} from "./types";
import { useBreakpointsValuesPx } from "@codegouvfr/react-dsfr/useBreakpointsValuesPx";
import { useWindowInnerSize } from "@codegouvfr/react-dsfr/tools/useWindowInnerSize";

export const getRiskFromScore = (score: number): IntRange<0, 4> => {
  if (score > 8) return 3;
  if (score > 6) return 2;
  if (score > 3) return 1;
  return 0;
};

export const getColorFromScore = (score: number): string => {
  if (score > 8) return "#F95A5C";
  if (score > 6) return "#FA7659";
  if (score > 3) return "#CB9F2D";
  return "#4B9F6C";
};

export const getColorFromRisk = (risk: number): string => {
  if (risk > 2) return "#F95A5C";
  if (risk > 1) return "#FA7659";
  if (risk > 0) return "#CB9F2D";
  return "#4B9F6C";
};

export const getColorFromLegende = (legende: number): string => {
  if (legende >= 70) return "#F95A5C";
  if (legende >= 65) return "#FA7659";
  if (legende >= 60) return "#CB9F2D";
  return "#4B9F6C";
};

export const getTextFromScore = (
  score: number,
  lowercase?: boolean,
): string => {
  if (score > 8) return lowercase ? "extrême" : "EXTRÊME";
  if (score > 6) return lowercase ? "fort" : "FORT";
  if (score > 3) return lowercase ? "moyen" : "MOYEN";
  return lowercase ? "faible" : "FAIBLE";
};

export const getTextFromRisk = (risk: number, lowercase?: boolean): string => {
  if (risk > 2) return lowercase ? "extrême" : "EXTRÊME";
  if (risk > 1) return lowercase ? "fort" : "FORT";
  if (risk > 0) return lowercase ? "moyen" : "MOYEN";
  return lowercase ? "faible" : "FAIBLE";
};

export const getIconFromScore = (
  score: number,
): FrIconClassName | RiIconClassName => {
  if (score > 8) return "ri-close-circle-fill";
  if (score > 6) return "ri-alert-fill";
  if (score > 3) return "ri-information-fill";
  return "ri-checkbox-circle-fill";
};

export const getIconFromNoiseCategorySlug = (
  slug: string,
): FrIconClassName | RiIconClassName => {
  switch (slug) {
    case "ECO":
      return "ri-school-fill";
    case "CAR":
      return "ri-car-fill";
  }

  return "ri-goblet-fill";
};

export const getReadableSource = (
  source: string,
  capitalize?: boolean,
): string => {
  switch (source) {
    case "A":
      return capitalize ? "Aérien" : "aérien";
    case "T":
      return capitalize ? "Tramway" : "tramway";
    case "R":
      return capitalize ? "Route" : "route";
    case "F":
      return capitalize ? "Fer" : "fer";
    case "I":
      return capitalize ? "Industrie" : "industrie";
    default:
      return source;
  }
};

export const getSummaryTextFromDiagnostic = (
  diagnostic: Diagnostic,
): string => {
  const risk = getRiskFromScore(diagnostic.score);

  switch (risk) {
    case 3:
      return "Votre parcelle est exposée à un <strong>risque extrême de nuisance sonore</strong>. Les projets de construction ou de rénovation sont soumis à des <strong>obligations réglementaires</strong>";
    case 2:
      return "Votre parcelle est exposée à un <strong>risque fort de nuisance sonore</strong>.";
    case 1:
      return "Votre parcelle est exposée à un <strong>risque moyen de nuisance sonore</strong>.";
    default:
      return "Votre parcelle est exposée à un <strong>risque faible de nuisance sonore</strong>.";
  }
};

export function replacePlaceholders(
  text: string,
  values: Record<string, string | number>,
): string {
  return text.replace(/{{(.*?)}}/g, (_, key) => {
    const cleanKey = key.trim();
    return values[cleanKey]?.toString() ?? "";
  });
}

export const getReadbleGeoGouvType = (type: string) => {
  switch (type) {
    case "street":
      return "rue";
    case "municipality":
      return "ville";
    case "housenumber":
      return "numéro";
    default:
      return type;
  }
};

export const getZoomFromGouvType = (type: string) => {
  switch (type) {
    case "street":
      return 17;
    case "municipality":
      return 12;
    case "housenumber":
      return 19;
    default:
      return 18;
  }
};

export const getZoomFromGeometry = (geometry: GeoJSON.Geometry): number => {
  const surface = area(geometry);

  if (surface < 500) return 19;
  if (surface < 1000) return 18;
  if (surface < 5000) return 17;
  if (surface < 20000) return 16;
  return 16;
};

export const getReadableCardinality = (direction: Cardinality) => {
  switch (direction) {
    case "N":
      return "le Nord";
    case "S":
      return "le Sud";
    case "E":
      return "l'Est";
    case "W":
      return "l'Ouest";
    case "NE":
      return "le Nord-Est";
    case "NW":
      return "le Nord-Ouest";
    case "SE":
      return "le Sud-Est";
    case "SW":
      return "le Sud-Ouest";
    default:
      return direction;
  }
};

export const normalizeToRings = (geometry: Geometry): [number, number][][] => {
  if (
    geometry.length > 0 &&
    Array.isArray(geometry[0]) &&
    Array.isArray(geometry[0][0]) &&
    typeof geometry[0][0][0] === "number"
  ) {
    return geometry as unknown as [number, number][][];
  }

  return geometry.flat(1) as unknown as [number, number][][];
};

export const mergeRings = (
  rings: [number, number][][],
): [number, number][][] => {
  const polygons: [number, number][][][] = rings.map((r) => [r]);

  const unionResult = union(polygons);

  return unionResult.flat() as [number, number][][];
};

export const transparentize = (
  hex: string,
  alpha: number,
  preserveAlpha = true,
): string => {
  if (!/^#([0-9A-F]{6})$/i.test(hex)) {
    throw new Error("Invalid hex color format. Use #RRGGBB.");
  }

  if (alpha < 0 || alpha > 1) {
    throw new Error("Alpha must be between 0 and 1.");
  }

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const toHex = (value: number) => value.toString(16).padStart(2, "0");

  if (preserveAlpha) {
    const a = Math.round(alpha * 255);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
  } else {
    const lighten = (value: number) =>
      Math.round(value + (255 - value) * (1 - alpha));

    return `#${toHex(lighten(r))}${toHex(lighten(g))}${toHex(lighten(b))}`;
  }
};

export const doesOptimalZoneIntersect = (
  optimalZonePoints: { x: number; y: number }[],
  intersectionGeometry: Geometry,
  projectPoint: (point: [number, number]) => { x: number; y: number },
): boolean => {
  const rings = normalizeToRings(intersectionGeometry);
  const projectedRings = rings.map((ring) =>
    ring.map(projectPoint).map(({ x, y }) => [x, y] as [number, number]),
  );

  return optimalZonePoints.some((pt) =>
    projectedRings.some((ring) => inside([pt.x, pt.y], ring)),
  );
};

export const getMinDistanceToSourcePoint = (
  optimalZonePoints: { x: number; y: number }[],
  sourcePoint: [number, number],
  unprojectPoint: ({ x, y }: { x: number; y: number }) => [number, number],
): number => {
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;

  const [lon1, lat1] = sourcePoint.map(toRadians);

  const optimalZoneUnprojected = optimalZonePoints.map((point) =>
    unprojectPoint(point),
  );

  const distances = optimalZoneUnprojected.map(([lon2Deg, lat2Deg]) => {
    const lon2 = toRadians(lon2Deg);
    const lat2 = toRadians(lat2Deg);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  });

  return Math.round(Math.min(...distances));
};

export const getNoiseSourceFromDiagnosticItem = (
  diagnosticItem: DiagnosticItem,
) => {
  const {
    diagnostic: {
      air_intersections,
      land_intersections_ld,
      land_intersections_ln,
    },
  } = diagnosticItem;

  const land_intersections = land_intersections_ld.concat(
    land_intersections_ln,
  );

  const noiseSources = [];

  if (!!air_intersections.length) {
    noiseSources.push("air");
  }

  if (!!land_intersections.length) {
    noiseSources.push("land");
  }

  return noiseSources;
};

export const getRecommendationsFilterConditionsFromDiagnostic = (
  diagnosticItem: DiagnosticItem,
) => {
  const {
    diagnostic: {
      score,
      isolation_min,
      isolation_max,
      soundclassification_intersections,
    },
  } = diagnosticItem;

  const noiseSources = getNoiseSourceFromDiagnosticItem(diagnosticItem);
  const hasSoundClassificationIntersections =
    !!soundclassification_intersections.length;

  return {
    conditions: {
      $and: [
        {
          $or: [
            {
              score_gte: {
                $lte: score,
              },
              score_lte: {
                $null: true,
              },
            },
            {
              score_gte: {
                $null: true,
              },
              score_lte: {
                $null: true,
              },
            },
            {
              score_gte: {
                $null: true,
              },
              score_lte: {
                $gte: score,
              },
            },
            {
              score_gte: {
                $lte: score,
              },
              score_lte: {
                $gte: score,
              },
            },
          ],
        },
        {
          $or: [
            {
              source: "all",
            },
            ...noiseSources.map((noiseSource) => ({ source: noiseSource })),
            ...(hasSoundClassificationIntersections && noiseSources.length === 0
              ? [{ source: "land" }]
              : []),
          ],
        },
        {
          $or: [
            {
              isolation_gte: {
                $lte: isolation_min,
              },
              isolation_lte: {
                $gte: isolation_min,
              },
            },
            {
              isolation_gte: {
                $lte: isolation_max,
              },
              isolation_lte: {
                $gte: isolation_max,
              },
            },
            {
              isolation_gte: {
                $null: true,
              },
              isolation_lte: {
                $null: true,
              },
            },
            {
              isolation_gte: {
                $lte: isolation_max,
              },
              isolation_lte: {
                $null: true,
              },
            },
            {
              isolation_gte: {
                $lte: isolation_min,
              },
              isolation_lte: {
                $null: true,
              },
            },
            {
              isolation_gte: {
                $null: true,
              },
              isolation_lte: {
                $gte: isolation_max,
              },
            },
            {
              isolation_gte: {
                $null: true,
              },
              isolation_lte: {
                $gte: isolation_min,
              },
            },
          ],
        },
      ],
    },
  };
};

export const getRecommendationsUtilFlags = (diagnosticItem: DiagnosticItem) => {
  const {
    diagnostic: {
      land_intersections_ld,
      soundclassification_intersections,
      air_intersections,
      flags: { isMultiExposedSources },
    },
  } = diagnosticItem;

  const hasDominatingAirIntersection =
    Math.max(
      ...air_intersections.map((intersection) => intersection.percent_impacted),
    ) > 0.8;

  return {
    isMonoExposed: !isMultiExposedSources,
    isAffectedByNoisemapIntersections: land_intersections_ld.length > 0,
    isAffectedBySoundclassificationIntersections:
      soundclassification_intersections.length > 0,
    isAffectedBySeveralSoundclassificationIntersections:
      soundclassification_intersections.length > 1,
    isAffectedByAirIntersections: air_intersections.length > 0,
    isAffectedBySeveralAirIntersections:
      air_intersections.length > 1 && !hasDominatingAirIntersection,
  };
};

export const getMaxIsolationFromSoundClassificationAffectedHelper = (
  optimalZoneSoundClassificationHelper: SoundClassificationIntersectionAffectedHelper[],
) => {
  return !!optimalZoneSoundClassificationHelper.length
    ? Math.max(
      ...optimalZoneSoundClassificationHelper.map(
        (helper) => helper.isolation,
      ),
    )
    : 0;
};

export const getIsMobile = () => {
  const { breakpointsValues } = useBreakpointsValuesPx();
  const { windowInnerWidth } = useWindowInnerSize();
  return windowInnerWidth < breakpointsValues.md;
}

export const normalize = (str: string) =>
  str.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export const imgUrl = (url: string) =>
  url.startsWith("/")
    ? `${process.env.REACT_APP_CMS_URL}${url}`
    : url