import { Image, Text, View } from "@react-pdf/renderer";
import ExposureBadge from "./ExposureBadge";
import {
  ReferencesBox,
  renderRuns,
  styles,
  type RegulationData,
  type Run,
} from "./DiagnosticPdf";

type PebZoneContent = { intro: Run[]; allowed: string[]; paragraphs: Run[][] };

const PEB_INTRO_RESTRICTED: Run[] = [
  { text: "L'essentiel des constructions ne sont pas autorisés", bold: true },
  {
    text:
      " dans cette zone fortement exposée au bruit aérien. Seuls ces bâtiments sont autorisés :",
  },
];
const PEB_PARA_EXISTING: Run[] = [
  { text: "Les bâtiments existants " },
  { text: "peuvent être rénovés", bold: true },
  { text: ", réhabilités, agrandis ou reconstruits, " },
  {
    text: "à condition de ne pas augmenter le nombre de personnes exposées au bruit",
    bold: true,
  },
  { text: "." },
];

const PEB_ZONE_CONTENT: Record<"A" | "B" | "C" | "D", PebZoneContent> = {
  D: {
    intro: [
      {
        text:
          "Toute construction est autorisée à condition de respecter les mesures d'isolation acoustique réglementaires.",
      },
    ],
    allowed: [],
    paragraphs: [],
  },
  C: {
    intro: PEB_INTRO_RESTRICTED,
    allowed: [
      "Équipements publics ou collectifs",
      "Logements liés à l'activité aéronautique",
      "Logements liés aux activités industrielles, commerciales ou agricoles",
      "Maisons individuelles dans les secteurs déjà urbanisés, desservies par les transports publics et sans augmentation de la population exposée au bruit.",
    ],
    paragraphs: [
      [
        {
          text:
            "Toutefois, des dérogations sont accordées pour les reconstructions consécutives à des démolitions en zones A ou B du plan d'exposition au bruit, ainsi que pour les opérations de renouvellement urbain n'entraînant pas d'accroissement de la population exposée.",
        },
      ],
      PEB_PARA_EXISTING,
    ],
  },
  B: {
    intro: PEB_INTRO_RESTRICTED,
    allowed: [
      "Logements liés à l'activité aéronautique",
      "Logements liés aux activités industrielles, commerciales ou agricoles",
      "Équipements publics ou collectifs liés à l'activité aéronautique ou indispensables aux populations existantes",
    ],
    paragraphs: [PEB_PARA_EXISTING],
  },
  A: {
    intro: PEB_INTRO_RESTRICTED,
    allowed: [
      "Logements liés à l'activité aéronautique",
      "Logements liés aux activités industrielles, commerciales ou agricoles situés dans les secteurs déjà urbanisés",
      "Équipements publics ou collectifs liés à l'activité aéronautique ou indispensables aux populations existantes",
    ],
    paragraphs: [PEB_PARA_EXISTING],
  },
};

const PEB_REFERENCES = [
  {
    label: "Récapitulatif des règles d’urbanismes applicables au zones PEB",
    url: "https://www.ecologie.gouv.fr/sites/default/files/documents/prescriptions_urbanisme_applicables_zones_bruits_aerodromes.pdf",
  },
  {
    label: "Informations sur le PEB",
    url: "https://www.ecologie.gouv.fr/politiques-publiques/bruit-organiser-lurbanisation-autour-aeroports",
  },
];

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const PEB_LOGO = `${STRAPI_URL}/images/flight.svg`;

export default function Peb({ peb }: { peb: RegulationData["peb"] }) {
  const content = PEB_ZONE_CONTENT[peb.zone];
  return (
    <View style={styles.regSection} wrap={false}>
      <View style={styles.regSectionHeader}>
        <View style={styles.regSectionHeaderLeft}>
          <Image src={PEB_LOGO} style={styles.regIcon} />
          <Text style={styles.regSectionTitle}>Nationale Aérien (PEB)</Text>
        </View>
        <ExposureBadge exposed={peb.exposed} />
      </View>
      {peb.exposed ? (
        <>
          <Text style={styles.regIntro}>
            Votre projet doit se conformer la réglementation suivante :
          </Text>
          <View style={styles.regCard}>
            <View style={styles.badgeRow}>
              <Text style={styles.zoneBadge}>Zone {peb.zone}</Text>
              <Text style={styles.sourceBadge}>Source : PEB</Text>
            </View>
            {renderRuns(content.intro)}
            {content.allowed.map((item, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
            {content.paragraphs.map((p, i) => renderRuns(p, i))}
          </View></>
      ) : (<Text style={styles.regIntro}>Votre parcelle n'est pas impactée par la réglementation Aérienne.</Text>)}
      <ReferencesBox links={PEB_REFERENCES} />
    </View>
  );
}
