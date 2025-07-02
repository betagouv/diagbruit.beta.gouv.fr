type IsolationTable = { [distance: number]: number[] };

const isolationTable: IsolationTable = {
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

export const getIsolation = (category: number, distance: number): number => {
  const distances = Object.keys(isolationTable)
    .map(Number)
    .sort((a, b) => a - b);

  if (distance < distances[0]) {
    const isolations = isolationTable[distances[0]];
    return isolations[category - 1] ?? 0;
  }

  for (const d of distances.sort((a, b) => b - a)) {
    if (d <= distance) {
      const isolations = isolationTable[d];
      return isolations[category - 1] ?? 0;
    }
  }

  const lastIsolations = isolationTable[distances[0]];
  return lastIsolations[category - 1] ?? 0;
};
