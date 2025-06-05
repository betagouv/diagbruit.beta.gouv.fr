import { fr } from "@codegouvfr/react-dsfr";
import { Cardinality, Geometry, LandIntersection } from "../../utils/types";
import { getColorFromLegende, normalizeToRings } from "../../utils/tools";

type DiagnosticParcelleSvgProps = {
  geometry: Geometry;
  intersections: LandIntersection[];
  width?: number;
  height?: number;
  padding?: number;
};

const getGradientDirection = (direction: Cardinality) => {
  switch (direction) {
    case "S":
      return { x1: "0%", y1: "100%", x2: "0%", y2: "0%" };
    case "N":
      return { x1: "0%", y1: "0%", x2: "0%", y2: "100%" };
    case "W":
      return { x1: "0%", y1: "0%", x2: "100%", y2: "0%" };
    case "E":
      return { x1: "100%", y1: "0%", x2: "0%", y2: "0%" };
    case "SW":
      return { x1: "0%", y1: "100%", x2: "100%", y2: "0%" };
    case "SE":
      return { x1: "100%", y1: "100%", x2: "0%", y2: "0%" };
    case "NW":
      return { x1: "0%", y1: "0%", x2: "100%", y2: "100%" };
    case "NE":
      return { x1: "100%", y1: "0%", x2: "0%", y2: "100%" };
    default:
      return { x1: "0%", y1: "0%", x2: "100%", y2: "0%" };
  }
};

const DiagnosticParcelleSvg = ({
  geometry,
  intersections,
  width = 500,
  height,
  padding = 10,
}: DiagnosticParcelleSvgProps) => {
  const rings = normalizeToRings(geometry);
  const allPoints: [number, number][] = rings.flat();

  if (
    !Array.isArray(rings) ||
    rings.length === 0 ||
    rings.some((ring) => !Array.isArray(ring))
  ) {
    return <div>Invalid geometry</div>;
  }

  const lons = allPoints.map(([lon]) => lon);
  const lats = allPoints.map(([, lat]) => lat);

  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const geoWidth = Math.max(maxLon - minLon, 1e-6);
  const geoHeight = Math.max(maxLat - minLat, 1e-6);

  const drawableWidth = Math.max(width - 2 * padding, 1);

  const scale = drawableWidth / geoWidth;
  const drawableHeight = geoHeight * scale;

  const computedHeight = drawableHeight + 2 * padding;

  const offsetX = (width - geoWidth * scale) / 2;
  const offsetY = padding;

  const convertRingToPoints = (ring: [number, number][]) =>
    ring
      .map(([lon, lat]) => {
        const x = (lon - minLon) * scale + offsetX;
        const y = (maxLat - lat) * scale + offsetY;
        return `${x},${y}`;
      })
      .join(" ");

  const convertRingToPath = (ring: [number, number][]) =>
    ring
      .map(([lon, lat], index) => {
        const x = (lon - minLon) * scale + offsetX;
        const y = (maxLat - lat) * scale + offsetY;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ") + " Z";

  return (
    <svg width={width} height={computedHeight}>
      <defs>
        {intersections
          .sort((a, b) => a.legende - b.legende)
          .map((intersection, index) => {
            const gradId = `grad-${index}`;
            const dir = getGradientDirection(intersection.direction);
            const color = getColorFromLegende(intersection.legende);
            const p =
              intersection.percent_impacted > 0.5
                ? intersection.percent_impacted - 0.1
                : intersection.percent_impacted + 0.1;

            return (
              <linearGradient
                key={gradId}
                id={gradId}
                gradientUnits="userSpaceOnUse"
                {...dir}
              >
                <stop offset="0%" stopColor={color} />
                <stop offset={`${p * 100}%`} stopColor={color} />
                <stop
                  offset={`${p * 100}%`}
                  stopColor={color}
                  stopOpacity={0}
                />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        <clipPath id="polygon-clip">
          {rings.map((ring, i) => (
            <path key={i} d={convertRingToPath(ring)} />
          ))}
        </clipPath>
      </defs>

      <g clipPath="url(#polygon-clip)">
        {intersections.map((intersection, index) => (
          <polygon
            key={index}
            points={convertRingToPoints(rings[0])}
            fill={`url(#grad-${index})`}
            stroke="none"
          />
        ))}
      </g>

      {rings.map((ring, index) => (
        <polygon
          key={`stroke-${index}`}
          points={convertRingToPoints(ring)}
          fill="transparent"
          stroke={fr.colors.decisions.background.flat.blueFrance.default}
          strokeWidth="2"
        />
      ))}
    </svg>
  );
};

export default DiagnosticParcelleSvg;
