import { Document, Font, Link, Page, Path, StyleSheet, Svg, Text, View, Image } from "@react-pdf/renderer";
import path from "path";
import Peb from "./Peb";
import SoundClassification from "./SoundClassification";
import Plu from "./Plu";
import Isolation from "./Isolation";
import Info from "./Info";
import PositionSvg from "./PositionSvg";
import Preconisations from "./Preconisations";
import { dsfr } from "./pdfTokens";

const CUSTOMER_SERVICE_PATH =
  "M22 17.002a6.002 6.002 0 0 1-4.713 5.86l-.638-1.914A4.003 4.003 0 0 0 19.465 19H17a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2.938a8.001 8.001 0 0 0-15.876 0H7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5C2 6.477 6.477 2 12 2s10 4.477 10 10v5.002Z";

const FONTS_DIR = path.join(process.cwd(), "public", "fonts");
Font.register({
  family: "Marianne",
  fonts: [
    { src: path.join(FONTS_DIR, "Marianne-Regular.woff"), fontWeight: 400 },
    { src: path.join(FONTS_DIR, "Marianne-Medium.woff"), fontWeight: 500 },
    { src: path.join(FONTS_DIR, "Marianne-Bold.woff"), fontWeight: 700 },
  ],
});

export interface DiagnosticPdfData {
  parcelNumber: string;
  score: number;
  maxDbLden?: number | null;
  flags?: {
    isMultiExposedSources?: boolean;
    isPriorityZone?: boolean;
    hasClassificationWarning?: boolean;
  };
  link: string;
  generatedAt: string;
  address?: string | null;
  regulation?: RegulationData;
  isolation?: IsolationData;
  plu?: PluData;
  noiseMap?: NoiseMapData;
  position?: PositionData;
}

export interface PositionData {
  size: number;
  parcellePoints: string[];
  zones: { d: string; fill: string }[];
  optimalPoints: { x: number; y: number }[];
}

export interface NoiseMapRow {
  type: string;
  producer: string;
  name: string;
  dayLevel: string;
  nightLevel: string;
}

export interface NoiseMapData {
  rows: NoiseMapRow[];
}

export interface PluZone {
  label: string;
  content: string;
  source: string;
  reference: string;
}

export interface PluData {
  zones: PluZone[];
  references: { label: string; url: string }[];
}

export interface IsolationData {
  min: number | null;
  max: number | null;
  hasPeb: boolean;
  hasCls: boolean;
}

export interface RegulationSoundRow {
  type: string;
  name: string;
  category: number | string;
  minDistance: number;
  maxDistance: number;
}

export interface RegulationData {
  peb: { exposed: boolean; zone: "A" | "B" | "C" | "D" | null };
  soundClassification: { exposed: boolean; rows: RegulationSoundRow[] };
}

export type Run = { text: string; bold?: boolean };


export const styles = StyleSheet.create({
  page: {
    paddingVertical: dsfr.spacing(10),
    paddingHorizontal: dsfr.spacing(12),
    fontSize: dsfr.fontSize.sm,
    fontFamily: "Marianne",
    color: dsfr.colors.defaultGrey,
    lineHeight: 1.5,
  },
  header: {
    paddingBottom: dsfr.spacing(2),
    marginBottom: dsfr.spacing(2),
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(2),
  },
  headerLogo: {
    height: 24,
    width: 24,
  },
  brand: {
    fontSize: dsfr.fontSize.h4,
    fontFamily: "Marianne",
    fontWeight: 700,
  },
  headerBrand: {
    fontSize: 10,
    fontFamily: "Marianne",
    fontWeight: 700,
    lineHeight: 1,
  },
  subtitle: {
    fontSize: dsfr.fontSize.xxs,
    fontWeight: 700,
    lineHeight: 1,
  },
  section: {
    marginBottom: dsfr.spacing(4),
  },
  label: {
    fontSize: dsfr.fontSize.xs,
    color: dsfr.colors.mentionGrey,
    textTransform: "uppercase",
    marginBottom: dsfr.spacing(1),
  },
  value: {
    fontSize: dsfr.fontSize.lg,
    fontFamily: "Marianne",
    fontWeight: 700,
    color: dsfr.colors.titleGrey,
  },
  title: {
    fontWeight: 700,
    fontFamily: "Marianne",
    fontSize: dsfr.fontSize.xs,
  },
  score: {
    fontSize: dsfr.fontSize.h2,
    fontFamily: "Marianne",
    fontWeight: 700,
    color: dsfr.colors.blueFrance,
  },
  bullet: {
    fontSize: dsfr.fontSize.sm,
    marginBottom: dsfr.spacing(1),
  },
  link: {
    fontSize: dsfr.fontSize.sm,
    color: dsfr.colors.blueFrance,
    textDecoration: "underline",
  },
  sonoscore: {
    flexDirection: "row",
    width: "100%",
    marginBottom: dsfr.spacing(4),
  },
  sonoscoreLeft: {
    flex: 1,
    padding: `${dsfr.spacing(10)}px ${dsfr.spacing(6)}px`,
    backgroundColor: dsfr.colors.blueFrance,
    color: "#ffffff",
  },
  sonoTitle: {
    fontSize: dsfr.fontSize.lg,
    fontFamily: "Marianne",
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: dsfr.spacing(5),
  },
  sonoParcelle: {
    fontSize: dsfr.fontSize.sm,
    fontFamily: "Marianne",
    fontWeight: 700,
    marginBottom: dsfr.spacing(3),
  },
  sonoAddress: {
    fontSize: dsfr.fontSize.xs,
    marginBottom: dsfr.spacing(2),
    fontWeight: 400,

  },
  sonoDate: {
    fontSize: dsfr.fontSize.xxs,
    fontWeight: 400,

  },
  sonoscoreRight: {
    flex: 1,
    padding: dsfr.spacing(4),
    borderWidth: 1,
    borderColor: dsfr.colors.blueFrance,
    color: dsfr.colors.defaultGrey,
    fontSize: dsfr.fontSize.xs,
    lineHeight: 1.5,
  },
  info: {
    marginTop: dsfr.spacing(6),
    borderWidth: 1,
    borderColor: dsfr.colors.borderGrey,
    borderRadius: dsfr.spacing(1),
    overflow: "hidden",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(2),
    backgroundColor: dsfr.colors.borderGrey,
    paddingVertical: dsfr.spacing(2),
    paddingHorizontal: dsfr.spacing(4),
  },
  infoBody: {
    padding: dsfr.spacing(2),
  },
  infoIcon: {
    width: 10,
    height: 10,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoIconText: {
    fontSize: 8,
    fontFamily: "Marianne",
    fontWeight: 400,
    lineHeight: 1.5,
  },
  infoTitle: {
    fontSize: dsfr.fontSize.xs,
    fontFamily: "Marianne",
    fontWeight: 400,
    lineHeight: 1.5,
  },

  contactIcon: {
    width: 16,
    height: 16,
  },

  // Blue header/title/text reused by the Contact ("Conseils diagBruit") box.
  recoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(2),
    marginBottom: dsfr.spacing(4),
  },
  recoTitle: {
    fontSize: dsfr.fontSize.xs,
    fontFamily: "Marianne",
    fontWeight: 700,
    color: dsfr.colors.blueFrance,
  },
  recoParagraph: {
    fontSize: dsfr.fontSize.xxs,
    color: dsfr.colors.blueFrance,
    fontWeight: 400,
    lineHeight: 1.5,
  },

  regSection: {
    marginBottom: dsfr.spacing(2),
  },
  regSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: dsfr.colors.contrastBlueFrance,
    paddingVertical: dsfr.spacing(2),
    paddingHorizontal: dsfr.spacing(3),
    marginBottom: dsfr.spacing(3),
  },
  regSectionTitle: {
    fontSize: dsfr.fontSize.xs,
    fontFamily: "Marianne",
    fontWeight: 400,
    lineHeight: 1.5,
    color: dsfr.colors.blueFrance,
  },
  exposedBadge: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#b34000",
    backgroundColor: "#ffe9e6",
    paddingVertical: 2,
    lineHeight: 1.5,
    paddingHorizontal: dsfr.spacing(2),
  },
  nonExposedBadge: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#18753C",
    backgroundColor: "#B8FEC9",
    paddingVertical: 2,
    lineHeight: 1.5,
    paddingHorizontal: dsfr.spacing(2),
  },
  regIntro: {
    fontSize: dsfr.fontSize.xxs,
  },
  regCard: {
    borderWidth: 1,
    borderColor: dsfr.colors.blueFrance,
    padding: dsfr.spacing(4),
    marginBottom: dsfr.spacing(3),
  },
  badgeRow: {
    flexDirection: "row",
    gap: dsfr.spacing(2),
    marginBottom: dsfr.spacing(3),
  },
  zoneBadge: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#ce0500",
    backgroundColor: "#ffe9e6",
    paddingVertical: 2,
    lineHeight: 1.5,
    paddingHorizontal: dsfr.spacing(2),
  },
  sourceBadge: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    fontWeight: 700,
    textTransform: "uppercase",
    color: dsfr.colors.defaultGrey,
    backgroundColor: "#eeeeee",
    paddingVertical: 2,
    lineHeight: 1.5,
    paddingHorizontal: dsfr.spacing(2),
  },
  regParagraph: {
    fontSize: dsfr.fontSize.xxs,
    lineHeight: 1.5,
  },
  bold: {
    fontFamily: "Marianne",
    fontWeight: 700,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: dsfr.spacing(1),
    paddingLeft: dsfr.spacing(2),
  },
  bulletDot: {
    fontSize: dsfr.fontSize.xxs,
    lineHeight: 1.5,
    marginRight: dsfr.spacing(2),
  },
  listText: {
    flex: 1,
    fontSize: dsfr.fontSize.xxs,
    lineHeight: 1.5,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: dsfr.colors.borderGrey,
    marginBottom: dsfr.spacing(2),
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: dsfr.colors.borderGrey,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: dsfr.colors.borderGrey,
  },
  th: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    fontWeight: 700,
    color: dsfr.colors.titleGrey,
    padding: dsfr.spacing(2),
    lineHeight: 1.2,
  },
  td: {
    fontSize: dsfr.fontSize.xxs,
    padding: dsfr.spacing(2),
    lineHeight: 1.2,
  },
  colType: { flex: 1.2 },
  colName: { flex: 2 },
  colCat: { flex: 1 },
  colDist: { flex: 1.4 },
  tableNote: {
    fontSize: dsfr.fontSize.xxs,
    color: dsfr.colors.mentionGrey,
    marginBottom: dsfr.spacing(1),
  },
  refBox: {
    marginTop: dsfr.spacing(1),
  },
  refTitle: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    fontWeight: 700,
    color: dsfr.colors.defaultGrey,
    lineHeight: 1.2,
    marginBottom: dsfr.spacing(0.5),
  },
  refLinks: {
    fontSize: dsfr.fontSize.xxs,
    color: dsfr.colors.defaultGrey,
    lineHeight: 1.2,
  },
  refLink: {
    fontSize: dsfr.fontSize.xxs,
    color: dsfr.colors.defaultGrey,
    textDecoration: "underline",
  },
  footer: {
    marginTop: dsfr.spacing(6),
    fontSize: dsfr.fontSize.xs,
    color: dsfr.colors.disabledGrey,
    borderTopWidth: 1,
    borderTopColor: dsfr.colors.borderGrey,
    paddingTop: dsfr.spacing(2),
  },
  positionSvgWrap: {
    alignItems: "center",
    marginTop: dsfr.spacing(6),
  },
});

const Header = () => {
  return (<View style={styles.header}>
    <Image
      style={styles.headerLogo}
      src={`${process.env.STRAPI_URL || "http://localhost:1337"}/images/brandIcon.svg`} />
    <Text style={styles.headerBrand}>diagBruit</Text>
    <Text style={styles.subtitle}>Intégrez les risques sonores dès la conception d’un projet immobilier</Text>
  </View>);
}

export const renderRuns = (runs: Run[], key?: number) => (
  <Text key={key} style={styles.regParagraph}>
    {runs.map((r, i) =>
      r.bold ? (
        <Text key={i} style={styles.bold}>{r.text}</Text>
      ) : (
        r.text
      ),
    )}
  </Text>
);

const getRiskSummaryRuns = (score: number): Run[] => {
  if (score > 8) {
    return [
      { text: "Votre parcelle est exposée à un " },
      { text: "risque extrême de nuisance sonore.", bold: true },
      {
        text:
          " Les projets de construction ou de rénovation sont soumis à des ",
      },
      { text: "obligations réglementaires", bold: true },
      { text: "." },
    ];
  }
  const level = score > 6 ? "fort" : score > 3 ? "moyen" : "faible";
  return [
    { text: "Votre parcelle est exposée à un " },
    { text: `risque ${level} de nuisance sonore.`, bold: true }
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

export const ReferencesBox = ({ links }: { links: { label: string; url: string }[] }) => (
  <View style={styles.refBox}>
    <Text style={styles.refTitle}>Références</Text>
    <Text style={styles.refLinks}>
      {links.map((l, i) => (
        <Text key={i}>
          {i > 0 ? " | " : ""}
          <Link src={l.url} style={styles.refLink}>{l.label}</Link>
        </Text>
      ))}
    </Text>
  </View>
);

export default function DiagnosticPdf({ data }: { data: DiagnosticPdfData }) {
  return (
    <Document title={`Diagnostic acoustique - ${data.parcelNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image
            src={`${process.env.STRAPI_URL || "http://localhost:1337"}/images/brandIcon.svg`} />
          <Text style={styles.brand}>diagBruit</Text>
        </View>

        <View style={styles.sonoscore}>
          <View style={styles.sonoscoreLeft}>
            <Text style={styles.sonoTitle}>Diagnostic complet sur les risques sonores</Text>
            <Text style={styles.sonoParcelle}>Parcelle n°{data.parcelNumber}</Text>
            {data.address && <Text style={styles.sonoAddress}>{data.address}</Text>}
            <Text style={styles.sonoDate}>Édité le {data.generatedAt}</Text>
          </View>
          <View style={styles.sonoscoreRight}>
            <Text>{renderInlineRuns(getRiskSummaryRuns(data.score))}</Text>
          </View>
        </View>

        <Info
          title="Recommandations"
          barColor={dsfr.colors.contrastBlueFrance}
          titleColor={dsfr.colors.blueFrance}
          icon={
            <Svg style={styles.contactIcon} viewBox="0 0 24 24">
              <Path d={CUSTOMER_SERVICE_PATH} fill={dsfr.colors.blueFrance} />
            </Svg>
          }
        >
          <View style={styles.listItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.listText}>
              <Text style={styles.bold}>Rendez-vous sur place</Text> afin
              d'évaluer l'environnement sonore en fonction de vos usages et de
              votre sensibilité au bruit.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.listText}>
              <Text style={styles.bold}>
                Faites appel à un acousticien certifié ou à un bureau d'études
                spécialisé
              </Text>{" "}
              avant le dépôt du permis de construire pour une évaluation plus
              précise et prendre en compte l'orientation, la hauteur du
              bâtiment, ainsi que la mise en œuvre éventuelle de protections
              acoustiques adaptées.
            </Text>
          </View>
        </Info>

        <Info
          title="Informations"
          barColor={dsfr.colors.borderGrey}
          icon={
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>i</Text>
            </View>
          }
        >
          <View style={styles.listItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.listText}>
              diagBruit est un service public d'information qui s'appuie sur des
              données officielles.{" "}
              <Text style={styles.bold}>
                Les résultats fournis sont des recommandations et n'ont pas de
                valeur juridique opposable.
              </Text>
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.listText}>
              Le risque est évalué grâce aux{" "}
              <Text style={styles.bold}>cartes de bruit</Text>,{" "}
              <Text style={styles.bold}>la présence de bâtiments</Text>{" "}
              susceptibles de faire écran au bruit (indépendamment de leur
              hauteur), et{" "}
              <Text style={styles.bold}>
                la part de votre parcelle réellement exposée
              </Text>{" "}
              aux nuisances. C'est la combinaison de ces critères qui explique
              que{" "}
              <Text style={styles.bold}>
                deux parcelles, même voisines, puissent afficher des niveaux de
                risque différents.
              </Text>
            </Text>
          </View>
        </Info>

        <Text style={styles.footer}>
          diagBruit, service public d'information sur l'exposition sonore des parcelles.
        </Text>
      </Page>
      {(data.regulation || data.plu || data.isolation) && (
        <Page size="A4" style={styles.page}>
          <Header />
          <Text style={styles.title}>
            Réglementations
          </Text>
          {data.regulation.peb.exposed && data.regulation.peb.zone && (
            <Peb peb={data.regulation.peb} />
          )}
          {data.regulation.soundClassification.exposed && (
            <SoundClassification
              soundClassification={data.regulation.soundClassification}
            />
          )}
          {data.plu && <Plu plu={data.plu} />}
          {data.isolation && <Isolation isolation={data.isolation} />}
        </Page>
      )}
      <Page size="A4" style={styles.page}>
        <Header />
        <Text style={styles.title}>
          Position du bâti
        </Text>
        {data.position && (
          <PositionSvg
            position={data.position}
            noiseMapRows={data.noiseMap?.rows ?? []}
          />
        )}
        <Preconisations />
      </Page>
    </Document>
  );
}
