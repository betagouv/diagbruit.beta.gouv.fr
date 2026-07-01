import { Circle, Path, Polygon, Svg, View } from "@react-pdf/renderer";
import { styles, type PositionData } from "./DiagnosticPdf";

const OUTLINE_COLOR = "#000091";

export default function PositionSvg({ position }: { position: PositionData }) {
  if (!position || position.parcellePoints.length === 0) return null;
  const { size, parcellePoints, zones, optimalPoints } = position;
  return (
    <View style={styles.positionSvgWrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {zones.map((zone, i) => (
          <Path key={`zone-${i}`} d={zone.d} fill={zone.fill} />
        ))}
        {parcellePoints.map((points, i) => (
          <Polygon
            key={`parcelle-${i}`}
            points={points}
            stroke={OUTLINE_COLOR}
            strokeWidth={2}
          />
        ))}
        {optimalPoints.map((pt, i) => (
          <Circle
            key={`opt-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={1}
            fill={OUTLINE_COLOR}
            fillOpacity={0.7}
          />
        ))}
      </Svg>
    </View>
  );
}
