import { fr } from "@codegouvfr/react-dsfr";
import { useEffect, useRef, useState } from "react";
import { useOptimalZone } from "../../hooks/useOptimalZone";
import { getProjectionUtils, smoothPolygon } from "../../utils/draw";
import {
  getColorFromLegende,
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
  onOptimalUtilsLoaded: (
    optimalZonePoints: { x: number; y: number }[],
    projectPoint: (point: [number, number]) => { x: number; y: number },
    unprojectPoint: ({ x, y }: { x: number; y: number }) => [number, number]
  ) => void;
};

const BOX_SIZE = 400;

const DiagnosticParcelleSvg = ({
  geometry,
  intersections,
  width = BOX_SIZE,
  padding = 10,
  onOptimalUtilsLoaded,
}: DiagnosticParcelleSvgProps) => {
  const rawRings = normalizeToRings(geometry);
  const rings = mergeRings(rawRings);
  const svgRef = useRef<SVGSVGElement>(null);
  const [lastOZPSent, setLastOZPSent] = useState<{ x: number; y: number }[]>();

  if (
    !Array.isArray(rings) ||
    rings.length === 0 ||
    rings.some((r) => !Array.isArray(r))
  ) {
    return <div>Invalid geometry</div>;
  }

  const computedHeight = BOX_SIZE;

  const { projectPoint, projectRing, unprojectPoint } = getProjectionUtils(
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

  useEffect(() => {
    if (!!optimalZonePoints && !!projectPoint && !!unprojectPoint) {
      if (JSON.stringify(optimalZonePoints) !== JSON.stringify(lastOZPSent)) {
        onOptimalUtilsLoaded(optimalZonePoints, projectPoint, unprojectPoint);
        setLastOZPSent(optimalZonePoints);
      }
    }
  }, [optimalZonePoints, projectPoint, unprojectPoint]);

  return (
    <div style={{ position: "relative", width, height: computedHeight }}>
      <svg width={width} height={computedHeight} ref={svgRef}>
        {[...intersections]
          .sort((a, b) => a.legende - b.legende)
          .flatMap((intersection, index) => {
            const color = getColorFromLegende(intersection.legende);
            const intersectionRings = normalizeToRings(
              intersection.geometry_intersection
            );

            return intersectionRings.map((ring, i) => (
              <path
                key={`intersection-${index}-${intersection.legende}-${i}`}
                d={smoothPolygon(ring.map(projectPoint))}
                fill={transparentize(color, 0.8, false)}
                strokeWidth={0}
              />
            ));
          })}
        {rings.map((ring, i) => (
          <polygon
            key={`parcelle-${i}`}
            points={projectRing(ring)}
            fill="transparent"
            stroke={fr.colors.decisions.background.flat.blueFrance.default}
            strokeWidth={2}
          />
        ))}
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
    </div>
  );
};

export default DiagnosticParcelleSvg;
