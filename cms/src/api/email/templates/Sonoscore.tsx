import {
  Image,
  Link,
  Path,
  Polygon,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  styles,
  type DiagnosticPdfData,
  type NoiseSourceGroup,
  type Run,
} from "./DiagnosticPdf";
import { dsfr } from "./pdfTokens";

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";

const ICON_ALERT =
  "M12.8659 3.00017L22.3922 19.5002C22.6684 19.9785 22.5045 20.5901 22.0262 20.8662C21.8742 20.954 21.7017 21.0002 21.5262 21.0002H2.47363C1.92135 21.0002 1.47363 20.5525 1.47363 20.0002C1.47363 19.8246 1.51984 19.6522 1.60761 19.5002L11.1339 3.00017C11.41 2.52187 12.0216 2.358 12.4999 2.63414C12.6519 2.72191 12.7782 2.84815 12.8659 3.00017ZM10.9999 16.0002V18.0002H12.9999V16.0002H10.9999ZM10.9999 9.00017V14.0002H12.9999V9.00017H10.9999Z";
const ICON_CLOSE_CIRCLE =
  "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 10.5858L9.17157 7.75736L7.75736 9.17157L10.5858 12L7.75736 14.8284L9.17157 16.2426L12 13.4142L14.8284 16.2426L16.2426 14.8284L13.4142 12L16.2426 9.17157L14.8284 7.75736L12 10.5858Z";
const ICON_INFORMATION =
  "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11 11V17H13V11H11ZM11 7V9H13V7H11Z";
const ICON_CHECKBOX_CIRCLE =
  "M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11.0026 16L18.0737 8.92893L16.6595 7.51472L11.0026 13.1716L8.17421 10.3431L6.75999 11.7574L11.0026 16Z";

const SOURCE_ICON_FILES: Record<string, string> = {
  ECO: "SchoolIcon.svg",
  CART: "CartIcon.svg",
  HEALTH: "HealthIcon.svg",
};
const DEFAULT_SOURCE_ICON = "GlassIcon.svg";

const getSourceIconUrl = (slug: string): string =>
  `${STRAPI_URL}/images/${SOURCE_ICON_FILES[slug] ?? DEFAULT_SOURCE_ICON}`;

const scoreColor = (s: number): string =>
  s > 8 ? "#F95A5C" : s > 6 ? "#FA7659" : s > 3 ? "#CB9F2D" : "#4B9F6C";
const scoreText = (s: number): string =>
  s > 8 ? "EXTRÊME" : s > 6 ? "FORT" : s > 3 ? "MOYEN" : "FAIBLE";
const scoreIcon = (s: number): string =>
  s > 8
    ? ICON_CLOSE_CIRCLE
    : s > 6
      ? ICON_ALERT
      : s > 3
        ? ICON_INFORMATION
        : ICON_CHECKBOX_CIRCLE;

const getRiskSummaryRuns = (score: number): Run[] => {
  if (score > 8) {
    return [
      { text: "Votre parcelle est exposée à un " },
      { text: "risque extrême de nuisance sonore.", bold: true },
      {
        text: " Les projets de construction ou de rénovation sont soumis à des ",
      },
      { text: "obligations réglementaires", bold: true },
      { text: "." },
    ];
  }
  const level = score > 6 ? "fort" : score > 3 ? "moyen" : "faible";
  return [
    { text: "Votre parcelle est exposée à un " },
    { text: `risque ${level} de nuisance sonore.`, bold: true },
  ];
};

const renderInlineRuns = (runs: Run[]) =>
  runs.map((r, i) =>
    r.bold ? (
      <Text key={i} style={styles.bold}>
        {r.text}
      </Text>
    ) : (
      r.text
    ),
  );

const RiskBadge = ({ score }: { score: number }) => (
  <View style={[s.badge, { backgroundColor: scoreColor(score) }]}>
    <Svg style={s.badgeIcon} viewBox="0 0 24 24">
      <Path d={scoreIcon(score)} fill={dsfr.colors.titleGrey} />
    </Svg>
    <Text style={s.badgeText}>RISQUE {scoreText(score)}</Text>
  </View>
);

const ScoreGauge = ({ score }: { score: number }) => {
  const cursorSeg = score <= 0 ? 1 : score > 10 ? 10 : Math.round(score);
  return (
    <View style={s.gauge}>
      {Array.from({ length: 10 }, (_, i) => (
        <View
          key={i}
          style={[s.segment, { backgroundColor: scoreColor(i + 1) }]}
        >
          {i + 1 === cursorSeg && <View style={s.cursor} />}
        </View>
      ))}
    </View>
  );
};

const SourceRow = ({ group }: { group: NoiseSourceGroup }) => (
  <View style={s.sourceRow}>
    <Image src={getSourceIconUrl(group.slug)} style={s.sourceIcon} />
    <Text style={s.sourceText}>
      {group.name} ({group.count})
    </Text>
  </View>
);

export default function Sonoscore({ data }: { data: DiagnosticPdfData }) {
  const noiseSources = data.noiseSources ?? [];
  const imgUrl = data.mapImage ? `${process.env.STRAPI_URL || "http://localhost:1337"}/fonts` : null
  return (
    <View style={s.sonoscore}>
      <View style={s.left}>
        <View style={s.leftContent}>
          <Text style={s.title}>Diagnostic des risques sonores extérieurs</Text>
          <Text style={s.subtitle}>
            Identifiez rapidement les parcelles exposées à des risques
            acoustiques et les réglementations à respecter.
          </Text>
        </View>
        {data.mapImage ? (
          <Image src={data.mapImage} style={s.mapImage} />
        ) : null}
      </View>

      <View style={s.right}>
        <Text style={s.date}>Édité le {data.generatedAt}</Text>
        <Text style={s.parcelle}>
          Parcelle n°{data.parcelNumber}
          {data.address ? `, ${data.address}` : ""}
        </Text>

        <RiskBadge score={data.score} />
        <ScoreGauge score={data.score} />

        <Text style={s.summary}>{renderInlineRuns(getRiskSummaryRuns(data.score))}</Text>

        {noiseSources.length > 0 ? (
          <>
            <Text style={s.sourcesIntro}>
              D'autres sources de bruit à proximité de votre parcelle peuvent
              générer une gêne sonore, notamment la nuit lorsque le niveau de
              bruit ambiant diminue :
            </Text>
            {noiseSources.map((group) => (
              <SourceRow key={group.slug} group={group} />
            ))}
          </>
        ) : (<Text style={s.sourcesIntro}>
          À ce jour, aucune autre source de nuisance sonore
          (ex. terrasse, école) n'a été identifiée à proximité de votre parcelle.
          Cela n'exclut pas l'existence de nuisances non référencées.
        </Text>)}

        <Link src={data.link} style={s.cta}>
          Retrouvez votre diagnostic en ligne
        </Link>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  sonoscore: {
    flexDirection: "row",
    width: "100%",
  },
  left: {
    flex: 1,
    backgroundColor: dsfr.colors.blueFrance,
    color: "#ffffff",
  },
  leftContent: {
    padding: dsfr.spacing(6),
  },
  title: {
    fontSize: dsfr.fontSize.lg,
    fontFamily: "Marianne",
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: dsfr.spacing(4),
  },
  subtitle: {
    fontSize: 10,
    fontFamily: "Marianne",
    fontWeight: 700,
    lineHeight: 1.4,
  },
  mapImage: {
    flexGrow: 1,
    width: "100%",
    minHeight: 140,
    objectFit: "cover",
  },
  right: {
    flex: 1,
    padding: dsfr.spacing(4),
    borderWidth: 1,
    borderColor: dsfr.colors.blueFrance,
    color: dsfr.colors.defaultGrey,
    fontSize: dsfr.fontSize.xs,
    lineHeight: 1.5,
  },
  date: {
    fontSize: dsfr.fontSize.xxs,
    fontWeight: 400,
    marginBottom: dsfr.spacing(2),
  },
  parcelle: {
    fontSize: 10,
    fontFamily: "Marianne",
    fontWeight: 500,
    lineHeight: 1.3,
    marginBottom: dsfr.spacing(3),
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: dsfr.spacing(1),
    paddingHorizontal: dsfr.spacing(2),
    borderRadius: 4,
    marginBottom: dsfr.spacing(3),
  },
  badgeIcon: {
    width: 14,
    height: 14,
  },
  badgeText: {
    fontSize: dsfr.fontSize.xs,
    fontFamily: "Marianne",
    fontWeight: 700,
    color: dsfr.colors.titleGrey,
  },
  gauge: {
    flexDirection: "row",
    height: 12,
    marginTop: dsfr.spacing(2),
    marginBottom: dsfr.spacing(4),
  },
  segment: {
    flex: 1,
    height: 8,
    position: "relative",
    borderLeftWidth: 0.8,
    borderRightWidth: 0.8,
    borderColor: "#ffffff",
  },
  cursor: {
    position: "absolute",
    top: -5,
    left: "50%",
    marginLeft: -5,
    width: 6,
    height: 18,
    backgroundColor: dsfr.colors.titleGrey,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  summary: {
    fontSize: 10,
    fontFamily: "Marianne",
    lineHeight: 1.4,
    marginBottom: dsfr.spacing(3),
  },
  sourcesIntro: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    lineHeight: 1.4,
    marginBottom: dsfr.spacing(3),
  },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(2),
    marginBottom: dsfr.spacing(2),
  },
  sourceIcon: {
    width: 14,
    height: 14,
  },
  sourceText: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
  },
  cta: {
    marginTop: dsfr.spacing(3),
    backgroundColor: dsfr.colors.blueFrance,
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "Marianne",
    fontWeight: 700,
    textAlign: "center",
    textDecoration: "underline",
    paddingVertical: dsfr.spacing(2),
    paddingHorizontal: dsfr.spacing(1),
  },
});
