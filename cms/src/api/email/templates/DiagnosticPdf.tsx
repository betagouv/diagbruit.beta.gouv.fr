import { Document, Font, Link, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import path from "path";
import Peb from "./Peb";
import SoundClassification from "./SoundClassification";
import Plu from "./Plu";
import Isolation from "./Isolation";
import NoiseMap from "./NoiseMap";
import Contact from "./Contact";
import IsolationBanner from "./IsolationBanner";

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
}

// One row of the "Cartes de bruit" synthesis table; values are pre-formatted
// strings built on the frontend (e.g. "70 dB", "-").
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

// One PLU "noise zone" entry. `content` is HTML authored in the CMS editor and
// rendered into native @react-pdf nodes by the Plu component's parser.
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

// Regulatory sound-isolation requirement (dB) plus the exposure flags used to
// phrase the requirement sentence (mirrors the frontend's RegulationIsolation).
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

const dsfr = {
  colors: {
    blueFrance: "#000091", // --blue-france-sun-113-625 (primary action/title)
    contrastBlueFrance: "#e3e3fd", // --background-contrast-blue-france (light callout bg)
    titleGrey: "#161616", // --text-title-grey
    defaultGrey: "#3a3a3a", // --text-default-grey
    mentionGrey: "#666666", // --text-mention-grey
    disabledGrey: "#929292", // --text-disabled-grey
    borderGrey: "#dddddd", // --border-default-grey
  },
  spacing: (units: number) => units * 4, // "Xv" → px
  fontSize: {
    xxs: 8, // fr-text--xs  (0.75rem)
    xs: 12, // fr-text--xs  (0.75rem)
    sm: 14, // fr-text--sm  (0.875rem)
    md: 16, // fr-text--lg  (1.125rem)
    lg: 18, // fr-text--lg  (1.125rem)
    h4: 24, // fr-h3
    h3: 28, // fr-h3
    h2: 32, // fr-h2
  },
} as const;

export const styles = StyleSheet.create({
  page: {
    paddingVertical: dsfr.spacing(10), // 40
    paddingHorizontal: dsfr.spacing(12), // 48
    fontSize: dsfr.fontSize.sm,
    fontFamily: "Marianne",
    color: dsfr.colors.defaultGrey,
    lineHeight: 1.5,
  },
  header: {
    paddingBottom: dsfr.spacing(3),
    marginBottom: dsfr.spacing(6),
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
  reco: {
    marginTop: dsfr.spacing(6),
    padding: dsfr.spacing(6),
    backgroundColor: dsfr.colors.contrastBlueFrance,
    borderRadius: dsfr.spacing(1),
  },
  recoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(2),
    marginBottom: dsfr.spacing(4),
  },
  recoIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: dsfr.colors.blueFrance,
    alignItems: "center",
    justifyContent: "center",
  },
  recoIconText: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    fontWeight: 700,
    color: dsfr.colors.blueFrance,
    lineHeight: 1,
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
  recoBold: {
    fontFamily: "Marianne",
    fontWeight: 700,
  },

  contactBox: {
    marginTop: dsfr.spacing(6),
    padding: dsfr.spacing(6),
    borderWidth: 1,
    borderColor: dsfr.colors.blueFrance,
    borderRadius: dsfr.spacing(1),
  },
  contactIcon: {
    width: 16,
    height: 16,
  },
  contactLink: {
    fontSize: dsfr.fontSize.xxs,
    color: dsfr.colors.blueFrance,
    textDecoration: "underline",
  },

  // --- "Besoin de conseils pour vous isoler du bruit ?" promo banner ---
  banner: {
    marginTop: dsfr.spacing(6),
    flexDirection: "row",
    borderWidth: 1,
    borderColor: dsfr.colors.borderGrey,
    borderRadius: dsfr.spacing(1),
    overflow: "hidden",
  },
  bannerImageWrap: {
    width: 180,
    flexDirection: "row",
  },
  bannerImage: {
    flex: 1,
    height: "100%",
    objectFit: "cover",
  },
  bannerText: {
    flex: 1,
    padding: dsfr.spacing(6),
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: dsfr.fontSize.lg,
    fontFamily: "Marianne",
    fontWeight: 700,
    color: dsfr.colors.titleGrey,
    marginBottom: dsfr.spacing(3),
  },
  bannerBody: {
    fontSize: dsfr.fontSize.xs,
    color: dsfr.colors.blueFrance,
  },
  bannerLink: {
    fontSize: dsfr.fontSize.xs,
    color: dsfr.colors.blueFrance,
    textDecoration: "underline",
  },

  regSection: {
    marginBottom: dsfr.spacing(8),
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
  },
  td: {
    fontSize: dsfr.fontSize.xxs,
    padding: dsfr.spacing(2),
  },
  colType: { flex: 1.2 },
  colName: { flex: 2 },
  colCat: { flex: 1 },
  colDist: { flex: 1.4 },
  tableNote: {
    fontSize: dsfr.fontSize.xxs,
    color: dsfr.colors.mentionGrey,
    marginBottom: dsfr.spacing(3),
  },
  refBox: {
    borderWidth: 1,
    borderColor: dsfr.colors.borderGrey,
    padding: dsfr.spacing(2),
  },
  refTitle: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    fontWeight: 700,
    color: dsfr.colors.mentionGrey,
    paddingBottom: dsfr.spacing(1),

  },
  refLinks: {
    fontSize: dsfr.fontSize.xxs,
    color: dsfr.colors.mentionGrey,
  },
  refLink: {
    fontSize: dsfr.fontSize.xxs,
    color: dsfr.colors.mentionGrey,
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
          {i > 0 ? "   |   " : ""}
          <Link src={l.url} style={styles.refLink}>{l.label} </Link>
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

        <View style={styles.section}>
          <Text style={styles.label}>Score d'exposition sonore</Text>
          <Text style={styles.score}>{data.score}</Text>
        </View>

        {typeof data.maxDbLden === "number" && (
          <View style={styles.section}>
            <Text style={styles.label}>Niveau sonore maximal (Lden)</Text>
            <Text style={styles.value}>{data.maxDbLden} dB(A)</Text>
          </View>
        )}


        <View style={styles.section}>
          <Link src={data.link} style={styles.link}>Diagnostic complet en ligne</Link>
        </View>

        <View style={styles.reco}>
          <View style={styles.recoHeader}>
            <View style={styles.recoIcon}>
              <Text style={styles.recoIconText}>i</Text>
            </View>
            <Text style={styles.recoTitle}>Recommandations</Text>
          </View>
          <Text style={styles.recoParagraph}>
            Nous vous conseillons de{" "}
            <Text style={styles.recoBold}>vous rendre sur place</Text> afin
            d'évaluer l'environnement sonore en fonction de vos usages et de
            votre sensibilité au bruit.
          </Text>
          <Text style={styles.recoParagraph}>
            Notre analyse s'appuie sur les cartes de bruit réglementaires pour
            estimer l'exposition aux nuisances sonores. Pour une évaluation plus
            précise, nous vous recommandons de{" "}
            <Text style={styles.recoBold}>
              faire appel à un acousticien certifié ou à un bureau d'études
            </Text>{" "}
            spécialisé avant le dépôt du permis de construire. Cette étude
            permettra notamment de prendre en compte l'orientation et la hauteur
            du bâtiment, ainsi que la mise en œuvre éventuelle de protections
            acoustiques adaptées.
          </Text>
        </View>

        <Text style={styles.footer}>
          diagBruit, service public d'information sur l'exposition sonore des parcelles.
        </Text>
      </Page>
      <Page size="A4" style={styles.page}>
        <Header />
        <Text style={styles.title}>
          Réglementations
        </Text>

        {data.regulation && <Peb peb={data.regulation.peb} />}

        {data.regulation && (
          <SoundClassification
            soundClassification={data.regulation.soundClassification}
          />
        )}
      </Page>
      {(data.plu || data.isolation) &&
        <Page size="A4" style={styles.page}>
          <Header />
          {data.plu && <Plu plu={data.plu} />}
          {data.isolation && <Isolation isolation={data.isolation} />}
        </Page>
      }
      <Page size="A4" style={styles.page}>
        <Header />
        {data.noiseMap && <NoiseMap noiseMap={data.noiseMap} />}
        <Contact />
        <IsolationBanner />
      </Page>
      <Page size="A4" style={styles.page}>
        <Header />
        <Text style={styles.title}>
          Positions du bâti
        </Text>
      </Page>
    </Document>
  );
}
