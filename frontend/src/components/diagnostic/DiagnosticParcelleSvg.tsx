import { fr } from "@codegouvfr/react-dsfr";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useOptimalZone } from "../../hooks/useOptimalZone";
import { getProjectionUtils, smoothPolygon } from "../../utils/draw";
import {
  getColorFromLegende,
  getReadableSource,
  mergeRings,
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

export type DiagnosticParcelleSvgHandle = {
  optimalZonePoints: { x: number; y: number }[];
  projectPoint: (point: [number, number]) => { x: number; y: number };
};

const BOX_SIZE = 400;

const DiagnosticParcelleSvg = forwardRef<
  DiagnosticParcelleSvgHandle,
  DiagnosticParcelleSvgProps
>(({ geometry, intersections, width = BOX_SIZE, padding = 10 }, ref) => {
  const rawRings = normalizeToRings(geometry);
  const rings = mergeRings(rawRings);
  const svgRef = useRef<SVGSVGElement>(null);

  const [tooltip, setTooltip] = useState({
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

  const computedHeight = BOX_SIZE;

  const { projectPoint, projectRing } = getProjectionUtils(
    rings,
    width,
    computedHeight,
    padding
  );

  const { optimalZonePoints, bestPoint } = useOptimalZone({
    rings,
    intersections,
    projectPoint,
    width,
    height: computedHeight,
    safeZoneThreshold: 0.1,
    radiusPercent: 0.4,
  });

  useImperativeHandle(ref, () => ({
    optimalZonePoints,
    projectPoint,
  }));

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
                content: "Zone moins impactée par le bruit",
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
          .flatMap((intersection, index) => {
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
              <path
                key={`intersection-${index}-${intersection.legende}-${i}`}
                d={smoothPolygon(ring.map(projectPoint))}
                fill={transparentize(color, 0.8, false)}
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
        {bestPoint && (
          <circle
            cx={bestPoint.x}
            cy={bestPoint.y}
            r={6}
            fill={fr.colors.decisions.border.default.purpleGlycine.default}
            opacity={0.8}
          />
        )}
        {optimalZonePoints.map((pt, i) => (
          <circle
            key={`optimalzone-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={1}
            fill={fr.colors.decisions.background.flat.blueFrance.default}
            opacity={0.7}
          />
        ))}
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
});

export default DiagnosticParcelleSvg;
