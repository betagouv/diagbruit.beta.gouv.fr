import {
  Circle,
  Path,
  Polygon,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { styles, type NoiseMapRow, type PositionData } from "./DiagnosticPdf";
import { dsfr } from "./pdfTokens";

const OUTLINE_COLOR = dsfr.colors.blueFrance;
const BORDER_GREY = "#ffffff";
const SWATCH_BG = "#ffffff";

const lighten = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const l = (v: number) => Math.round(v + (255 - v) * 0.2);
  const to = (v: number) => l(v).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
};

const RISK_LEVELS = [
  { label: "faible", color: lighten("#4B9F6C") },
  { label: "moyen", color: lighten("#CB9F2D") },
  { label: "fort", color: lighten("#FA7659") },
  { label: "extrême", color: lighten("#F95A5C") },
];

const col = {
  type: { flex: 1.2 },
  producer: { flex: 1.2 },
  name: { flex: 1.4 },
  day: { flex: 1.4 },
  night: { flex: 1.4 },
};

const DotSwatch = () => (
  <Svg width={16} height={16}>
    <Rect
      x={0}
      y={0}
      width={16}
      height={16}
      fill={SWATCH_BG}
      stroke={BORDER_GREY}
    />
    {[4, 8, 12].flatMap((y) =>
      [4, 8, 12].map((x) => (
        <Circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={1}
          fill={OUTLINE_COLOR}
          fillOpacity={0.7}
        />
      )),
    )}
  </Svg>
);

const NoiseMapTable = ({ rows }: { rows: NoiseMapRow[] }) => {
  if (!rows || rows.length === 0) return null;
  return (
    <View style={[styles.table, { marginTop: 12 }]}>
      <View style={styles.tableHeaderRow}>
        <Text style={[styles.th, col.type]}>Type de source</Text>
        <Text style={[styles.th, col.producer]}>Producteur</Text>
        <Text style={[styles.th, col.name]}>Nom de la source</Text>
        <Text style={[styles.th, col.day]}>Niveau de bruit (jour)</Text>
        <Text style={[styles.th, col.night]}>Niveau de bruit (nuit)</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.td, col.type]}>{r.type}</Text>
          <Text style={[styles.td, col.producer]}>{r.producer}</Text>
          <Text style={[styles.td, col.name]}>{r.name}</Text>
          <Text style={[styles.td, col.day]}>{r.dayLevel}</Text>
          <Text style={[styles.td, col.night]}>{r.nightLevel}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PositionSvg({
  position,
  noiseMapRows,
}: {
  position: PositionData;
  noiseMapRows: NoiseMapRow[];
}) {
  if (!position || position.parcellePoints.length === 0) return null;
  const { size, parcellePoints, zones, optimalPoints } = position;

  return (
    <View>
      {/* Recommendation text */}
      <Text style={s.intro}>
        Nous vous conseillons{" "}
        <Text style={styles.bold}>
          d'implanter le bâtiment dans la zone idéale
        </Text>{" "}
        identifiée par diagBruit. Une étude acoustique reste nécessaire pour
        confirmer l'implantation du bâtiment. Nous vous recommandons de disposer
        les pièces de la façon suivante :
      </Text>

      <View style={s.bullet}>
        <Text style={s.dot}>•</Text>
        <Text style={s.bulletText}>
          Organiser le logement de façon traversante avec{" "}
          <Text style={styles.bold}>les pièces de vie</Text> (chambre, salon){" "}
          <Text style={styles.bold}>côté calme</Text>
        </Text>
      </View>
      <View style={s.bullet}>
        <Text style={s.dot}>•</Text>
        <Text style={s.bulletText}>
          Utiliser <Text style={styles.bold}>les pièces techniques</Text>{" "}
          (garage, cellier, escalier, couloirs, WC…) comme zone tampon{" "}
          <Text style={styles.bold}>côté source de bruit</Text>
        </Text>
      </View>
      <View style={s.bullet}>
        <Text style={s.dot}>•</Text>
        <Text style={s.bulletText}>
          <Text style={styles.bold}>Limiter les grandes ouvertures</Text> (baies
          vitrées, fenêtres de chambres) sur les façades{" "}
          <Text style={styles.bold}>exposées au bruit</Text>
        </Text>
      </View>

      {/* Legend + parcelle diagram, side by side */}
      <View style={s.row}>
        <View style={s.legend}>
          <View style={s.legendRow}>
            <DotSwatch />
            <Text style={s.legendLabel}>
              Zone idéale du bâti selon diagBruit
            </Text>
          </View>
          {RISK_LEVELS.map((lvl) => (
            <View key={lvl.label} style={s.legendRow}>
              <View style={[s.swatch, { backgroundColor: lvl.color }]} />
              <Text style={s.legendLabel}>
                Risque de niveau sonore {lvl.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.diagramCol}>
          <Svg width={220} height={220} viewBox={`0 0 ${size} ${size}`}>
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
          <Text style={s.caption}>Votre parcelle</Text>
        </View>
      </View>

      {/* Noise-source synthesis table */}
      <NoiseMapTable rows={noiseMapRows} />
    </View>
  );
}

const s = StyleSheet.create({
  intro: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    lineHeight: 1.5,
    marginTop: dsfr.spacing(2),
    marginBottom: dsfr.spacing(2),
  },
  bullet: {
    flexDirection: "row",
    marginBottom: dsfr.spacing(1),
    paddingLeft: dsfr.spacing(2),
  },
  dot: {
    fontSize: dsfr.fontSize.xxs,
    marginRight: dsfr.spacing(2),
    lineHeight: 1.25,
  },
  bulletText: {
    flex: 1,
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    lineHeight: 1.25,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(2),
  },
  legend: {
    flex: 1,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(2),
  },
  swatch: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: BORDER_GREY,
  },
  legendLabel: {
    flex: 1,
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
  },
  diagramCol: {
    flex: 1,
    alignItems: "center",
  },
  caption: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    color: dsfr.colors.mentionGrey,
  },
});
