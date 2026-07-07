import { Document, Font, Link, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import path from "path";
import Peb from "./Peb";
import SoundClassification from "./SoundClassification";
import Plu from "./Plu";
import Isolation from "./Isolation";
import Info from "./Info";
import Sonoscore from "./Sonoscore";
import PositionSvg from "./PositionSvg";
import Preconisations from "./Preconisations";
import { dsfr } from "./pdfTokens";

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
  noiseSources?: NoiseSourceGroup[];
  position?: PositionData;
  mapImage?: string | null;
}

export interface NoiseSourceGroup {
  name: string;
  slug: string;
  count: number;
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

const Header = () => {
  return (<View style={styles.header}>
    <Image
      style={styles.headerLogo}
      src={`${process.env.STRAPI_URL || "http://localhost:1337"}/images/brandIcon.svg`} />
    <Text style={styles.headerBrand}>diagBruit</Text>
    <Text style={styles.subtitle}>Intégrez les risques sonores dès la conception d’un projet immobilier</Text>
  </View>);
}

const PdfFooter = ({ data }: { data: DiagnosticPdfData }) => (
  <View fixed style={styles.footer}>
    <View style={styles.footerRow}>
      <View style={styles.footerLeft}>
        <Text style={styles.footerMeta}>
          Édité le {data.generatedAt} · Parcelle n°{data.parcelNumber}
          {data.address ? ` · ${data.address}` : ""}
        </Text>
        <Link src={data.link} style={styles.footerLink}>
          Retrouvez votre diagnostic en ligne
        </Link>
      </View>
      <Text
        style={styles.footerPage}
        render={(props) => {
          const { pageNumber, totalPages } = props as unknown as {
            pageNumber: number;
            totalPages: number;
          };
          return (
            <Text style={styles.footerPageText}>
              Page {pageNumber}/{totalPages}
            </Text>
          );
        }}
      />
    </View>
  </View>
);

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

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const CUSTOMER_SERVICE_ICON = `${STRAPI_URL}/images/customerServiceIcon.svg`;
const INFORMATION_ICON = `${STRAPI_URL}/images/informationIcon.svg`;
const FOOTER_LOGO = `${STRAPI_URL}/images/brandIconText.svg`;

const CEREMA_LOGO = `${STRAPI_URL}/images/cerema.png`;
const GOUV_LOGO = `${STRAPI_URL}/images/GouvBrandIcon.svg`;

const FirstPageFooter = () => (
  <View style={styles.brandFooter}>
    <View style={styles.brandFooterLeft}>
      <Image src={FOOTER_LOGO} style={styles.brandFooterLogo} />
      <View style={styles.brandFooterTextCol}>
        <Text style={styles.brandFooterTagline}>
          Intégrez les risques sonores dès la conception{"\n"}d'un projet
          immobilier
        </Text>
        <Text style={styles.brandFooterUrl}>diagbruit.beta.gouv.fr</Text>
      </View>
    </View>
    <Text style={styles.brandFooterContact}>contact@diagbruit.fr</Text>
    <View style={styles.brandFooterBrands}>
      <Image src={CEREMA_LOGO} style={styles.brandFooterCerema} />
      <Image src={GOUV_LOGO} style={styles.brandFooterGouv} />
    </View>
  </View>
);

export default function DiagnosticPdf({ data }: { data: DiagnosticPdfData }) {
  return (
    <Document title={`Diagnostic acoustique - ${data.parcelNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image
            src={`${process.env.STRAPI_URL || "http://localhost:1337"}/images/brandIconText.svg`} />
        </View>

        <Sonoscore data={data} />

        <Info
          title="Recommandations"
          barColor={dsfr.colors.contrastBlueFrance}
          titleColor={dsfr.colors.blueFrance}
          icon={
            <Image src={CUSTOMER_SERVICE_ICON} style={styles.icon} />
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
            <Image src={INFORMATION_ICON} style={styles.icon} />
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
        <FirstPageFooter />
      </Page>
      <Page size="A4" style={styles.page}>
        <Header />
        <Text style={styles.title}>
          Réglementations
        </Text>
        <Peb peb={data.regulation.peb} />
        <SoundClassification
          soundClassification={data.regulation.soundClassification}
        />
        <Plu plu={data.plu} />
        <Isolation isolation={data.isolation} />
        <PdfFooter data={data} />
      </Page>
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
        <Info
          title="Des questions sur votre diagnostic acoustique ?"
          barColor={dsfr.colors.contrastBlueFrance}
          titleColor={dsfr.colors.blueFrance}
          icon={
            <Image src={CUSTOMER_SERVICE_ICON} style={styles.icon} />
          }
        >
          <View style={styles.infoView}>
            <Text style={styles.listText}>
              L'équipe de diagBruit est à votre disposition pour vous accompagner et
              répondre à vos interrogations. N'hésitez pas à nous contacter par email à l'adresse suivante : {" "}
              <Link href="mailto:contact@diagbruit.fr">contact@diagbruit.fr</Link>
            </Text>
          </View>
        </Info>

        <PdfFooter data={data} />
      </Page>
    </Document>
  );
}

export const styles = StyleSheet.create({
  page: {
    paddingTop: dsfr.spacing(10),
    paddingBottom: dsfr.spacing(16),
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
    paddingBottom: dsfr.spacing(1),
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
  footer: {
    position: "absolute",
    bottom: dsfr.spacing(6),
    left: dsfr.spacing(12),
    right: dsfr.spacing(12),
    height: dsfr.spacing(8),
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: dsfr.spacing(2),
  },
  footerLeft: {
    flex: 1,
  },
  footerMeta: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    fontWeight: 400,
    color: dsfr.colors.defaultGrey,
    lineHeight: 1.4,
  },
  footerLink: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    fontWeight: 400,
    color: dsfr.colors.defaultGrey,
    textDecoration: "underline",
  },
  footerPage: {
    marginLeft: dsfr.spacing(4),
  },
  footerPageText: {
    fontSize: dsfr.fontSize.xxs,
    fontFamily: "Marianne",
    fontWeight: 400,
    color: dsfr.colors.defaultGrey,
    lineHeight: 1,
  },
  // Brand footer (first page only), pinned to the bottom margin.
  brandFooter: {
    position: "absolute",
    bottom: dsfr.spacing(6),
    left: dsfr.spacing(12),
    right: dsfr.spacing(12),
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: dsfr.spacing(2),
  },
  brandFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(2),
    flexShrink: 0,
  },
  brandFooterLogo: {
    width: 66,
    height: 15,
  },
  brandFooterTextCol: {
    flexShrink: 1,
  },
  brandFooterTagline: {
    fontSize: 8,
    fontFamily: "Marianne",
    fontWeight: 700,
    color: dsfr.colors.titleGrey,
    lineHeight: 1.25,
  },
  brandFooterUrl: {
    fontSize: 8,
    fontFamily: "Marianne",
    fontWeight: 400,
    color: dsfr.colors.mentionGrey,
    lineHeight: 1.25,
    marginTop: dsfr.spacing(1),
  },
  brandFooterContact: {
    flex: 1.5,
    fontSize: 8,
    fontFamily: "Marianne",
    fontWeight: 400,
    color: dsfr.colors.titleGrey,
    textAlign: "center",
    lineHeight: 1.25,
  },
  brandFooterBrands: {
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(3),
  },
  brandFooterCerema: {
    width: 88,
    height: 26,
  },
  brandFooterGouv: {
    width: 44,
    height: 40,
  },
  info: {
    marginTop: dsfr.spacing(2),
    borderWidth: 1,
    borderColor: dsfr.colors.borderGrey,
    overflow: "hidden",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(2),
    backgroundColor: dsfr.colors.borderGrey,
    paddingVertical: dsfr.spacing(1),
    paddingHorizontal: dsfr.spacing(3),
  },
  infoBody: {
    padding: dsfr.spacing(2),
  },
  infoIconText: {
    fontSize: 8,
    fontFamily: "Marianne",
    fontWeight: 400,
    lineHeight: 1.5,
  },
  infoTitle: {
    fontSize: 9,
    fontFamily: "Marianne",
    fontWeight: 400,
    lineHeight: 1.5,
  },

  // Blue header/title/text reused by the Contact ("Conseils diagBruit") box.
  recoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(2),
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
    paddingVertical: dsfr.spacing(1),
    paddingHorizontal: dsfr.spacing(3),
    marginBottom: dsfr.spacing(3),
  },
  regSectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: dsfr.spacing(1),
  },
  regSectionTitle: {
    fontSize: 9,
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
    padding: dsfr.spacing(2),
    marginBottom: dsfr.spacing(1),
  },
  regIcon: {
    height: 12,
    width: 12,
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
  ul: {
    marginVertical: dsfr.spacing(2),
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: dsfr.spacing(2),
  },
  infoView: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: dsfr.spacing(1),
    paddingLeft: 2,
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
    lineHeight: 1.5,
  },
  refBox: {
    marginBottom: dsfr.spacing(2),
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
  positionSvgWrap: {
    alignItems: "center",
    marginTop: dsfr.spacing(2),
  },
  icon: {
    height: 10,
    width: 10,
  }
});