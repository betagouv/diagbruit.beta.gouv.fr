import { useState, useRef } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import {
  getColorFromLegende,
  getReadableSource,
  normalizeToRings,
  transparentize,
} from "../../utils/tools";
import { Geometry, LandIntersection } from "../../utils/types";

type DiagnosticParcelleSvgProps = {
  geometry: Geometry;
  intersections: LandIntersection[];
  width?: number;
  padding?: number;
};

const BOX_SIZE = 500;

const DiagnosticParcelleSvg = ({
  geometry,
  intersections,
  width = BOX_SIZE,
  padding = 10,
}: DiagnosticParcelleSvgProps) => {
  const rings = normalizeToRings(geometry);
  const allPoints: [number, number][] = rings.flat();
  const svgRef = useRef<SVGSVGElement>(null);

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: "",
  });

  if (
    !Array.isArray(rings) ||
    rings.length === 0 ||
    rings.some((r) => !Array.isArray(r))
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
  const initialScale = drawableWidth / geoWidth;
  const rawHeight = geoHeight * initialScale + 2 * padding;
  const effectiveScale =
    rawHeight > BOX_SIZE ? (BOX_SIZE - 2 * padding) / geoHeight : initialScale;

  const computedHeight = BOX_SIZE;
  const offsetX = (width - geoWidth * effectiveScale) / 2;
  const offsetY = (BOX_SIZE - geoHeight * effectiveScale) / 2;

  const projectRing = (ring: [number, number][]) =>
    ring
      .map(([lon, lat]) => {
        const x = (lon - minLon) * effectiveScale + offsetX;
        const y = (maxLat - lat) * effectiveScale + offsetY;
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <div style={{ position: "relative", width, height: computedHeight }}>
      <svg width={width} height={computedHeight} ref={svgRef}>
        {rings.map((ring, i) => (
          <polygon
            key={`parcelle-${i}`}
            points={projectRing(ring)}
            fill="transparent"
            stroke={fr.colors.decisions.background.flat.blueFrance.default}
            strokeWidth={2}
            onMouseEnter={(e) => {
              const svgRect = svgRef.current?.getBoundingClientRect();
              setTooltip({
                visible: true,
                x: e.clientX - (svgRect?.left ?? 0) + 10,
                y: e.clientY - (svgRect?.top ?? 0) + 10,
                content: "Zone non impactée par le bruit",
              });
            }}
            onMouseMove={(e) => {
              const svgRect = svgRef.current?.getBoundingClientRect();
              setTooltip((prev) => ({
                ...prev,
                x: e.clientX - (svgRect?.left ?? 0) + 10,
                y: e.clientY - (svgRect?.top ?? 0) + 10,
              }));
            }}
            onMouseLeave={() => {
              setTooltip({ visible: false, x: 0, y: 0, content: "" });
            }}
          />
        ))}

        {intersections
          .sort((a, b) => a.legende - b.legende)
          .flatMap((intersection) => {
            const color = getColorFromLegende(intersection.legende);
            const intersectionRings = normalizeToRings(
              intersection.geometry_intersection
            );

            const tooltipContent = `${intersection.typeterr}${
              intersection.codeinfra ? ` - ${intersection.codeinfra}` : ""
            } (${getReadableSource(intersection.typesource, false)}) : ${
              intersection.legende
            } dB sur ${Math.round(
              intersection.percent_impacted * 100
            )}% de la parcelle`;

            return intersectionRings.map((ring, i) => (
              <polygon
                key={`intersection-${intersection.legende}-${i}`}
                points={projectRing(ring)}
                fill={transparentize(color, 0.5)}
                strokeWidth={0}
                onMouseEnter={(e) => {
                  const svgRect = svgRef.current?.getBoundingClientRect();
                  setTooltip({
                    visible: true,
                    x: e.clientX - (svgRect?.left ?? 0) + 10,
                    y: e.clientY - (svgRect?.top ?? 0) + 10,
                    content: tooltipContent,
                  });
                }}
                onMouseMove={(e) => {
                  const svgRect = svgRef.current?.getBoundingClientRect();
                  setTooltip((prev) => ({
                    ...prev,
                    x: e.clientX - (svgRect?.left ?? 0) + 10,
                    y: e.clientY - (svgRect?.top ?? 0) + 10,
                  }));
                }}
                onMouseLeave={() => {
                  setTooltip({ visible: false, x: 0, y: 0, content: "" });
                }}
              />
            ));
          })}
      </svg>

      {tooltip.visible && (
        <div
          style={{
            position: "absolute",
            top: tooltip.y,
            left: tooltip.x,
            background: "#000",
            color: "#fff",
            padding: "4px 8px",
            fontSize: 12,
            borderRadius: 4,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default DiagnosticParcelleSvg;
