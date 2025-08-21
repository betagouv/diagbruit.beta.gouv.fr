import { AirIntersection, SoundClassificationIntersection } from "./types";

type LandIsolationTable = { [distance: number]: number[] };

const landIsolationTable: LandIsolationTable = {
  10: [45, 42, 38, 35, 30],
  15: [45, 42, 38, 33],
  20: [44, 41, 37, 32],
  25: [43, 40, 36, 31],
  30: [42, 39, 35, 30],
  40: [41, 38, 34],
  50: [40, 37, 33],
  65: [39, 36, 32],
  80: [38, 35, 31],
  100: [37, 34, 30],
  125: [36, 33],
  160: [35, 32],
  200: [34, 31],
  250: [33, 30],
  300: [32],
};

const airIsolationValues: Record<string, number> = {
  A: 45,
  B: 40,
  C: 35,
  D: 32,
};

const isolationCorrectionTable: { maxGap: number; correction: number }[] = [
  { maxGap: 1, correction: 3 },
  { maxGap: 3, correction: 2 },
  { maxGap: 9, correction: 1 },
  { maxGap: Infinity, correction: 0 },
];

export const getLandIntersectionIsolation = (
  category: number,
  distance: number
): number => {
  const distances = Object.keys(landIsolationTable)
    .map(Number)
    .sort((a, b) => a - b);

  if (distance < distances[0]) {
    const isolations = landIsolationTable[distances[0]];
    return isolations[category - 1] ?? 0;
  }

  for (const d of distances.sort((a, b) => b - a)) {
    if (d <= distance) {
      const isolations = landIsolationTable[d];
      return isolations[category - 1] ?? 0;
    }
  }

  const lastIsolations = landIsolationTable[distances[0]];
  return lastIsolations[category - 1] ?? 0;
};

export const getLandIsolation = (
  soundclassification_intersections: SoundClassificationIntersection[]
): number => {
  if (!soundclassification_intersections.length) return 0;
  return Math.max(
    ...soundclassification_intersections.map((intersection) =>
      getLandIntersectionIsolation(
        intersection.sound_category,
        intersection.distance
      )
    )
  );
};

export const getAirIsolation = (
  air_intersetions: AirIntersection[]
): number => {
  const zonePriority = ["A", "B", "C", "D"];

  for (const zone of zonePriority) {
    if (air_intersetions.some((item) => item.zone === zone)) {
      return airIsolationValues[zone];
    }
  }

  return 0;
};

export const getComputedIsolation = (
  land_isolation: number,
  air_isolation: number
): number => {
  const maxIsolation = Math.max(land_isolation, air_isolation);
  const minIsolation = Math.min(land_isolation, air_isolation);
  const gap = maxIsolation - minIsolation;

  let tmpCorrection = 0;
  for (const { maxGap, correction } of isolationCorrectionTable) {
    if (gap <= maxGap) {
      tmpCorrection = correction;
    }
  }

  return maxIsolation + tmpCorrection;
};
