import { Image, Text, View } from "@react-pdf/renderer";
import ExposureBadge from "./ExposureBadge";
import { ReferencesBox, styles, type RegulationData } from "./DiagnosticPdf";

const TERRESTRE_REFERENCES = [
  { label: "Arrêté du 30 mai 1996", url: "https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027804837" },
  { label: "Arrêté du 23 juillet 2013", url: "https://www.legifrance.gouv.fr/loda/id/LEGIARTI000027789290" },
  {
    label: "Arrêté du 3 septembre 2013",
    url: "https://www.bulletin-officiel.developpement-durable.gouv.fr/documents/Bulletinofficiel-0027104/met_20130017_0100_0006.pdf",
  },
];

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const SOUND_CLASS_LOGO_1 = `${STRAPI_URL}/images/directions_car.svg`;
const SOUND_CLASS_LOGO_2 = `${STRAPI_URL}/images/directions_transit_filled.svg`;

export default function SoundClassification({
  soundClassification,
}: {
  soundClassification: RegulationData["soundClassification"];
}) {
  const { rows } = soundClassification;
  const maxCategory = rows.reduce(
    (m, r) => Math.max(m, Number(r.category) || 0),
    0,
  );
  return (
    <View style={styles.regSection}>
      <View wrap={false}>
        <View style={styles.regSectionHeader}>
          <View style={styles.regSectionHeaderLeft}>
            <Image src={SOUND_CLASS_LOGO_1} style={styles.regIcon} />
            <Image src={SOUND_CLASS_LOGO_2} style={styles.regIcon} />
            <Text style={styles.regSectionTitle}>
              Nationale Terrestre (Classement sonore)
            </Text>
          </View>
          <ExposureBadge exposed={soundClassification.exposed} />
        </View>
        {soundClassification.exposed ? (
          <View style={styles.regCard} wrap={false}>
            <View style={styles.badgeRow}>
              <Text style={styles.sourceBadge}>Source : Classement sonore</Text>
            </View>
            <Text style={styles.regParagraph}>
              La parcelle est exposée à {rows.length} source
              {rows.length > 1 ? "s" : ""} de bruit de catégorie {maxCategory}.
            </Text>
          </View>
        ) : (
          <Text style={styles.regIntro}>
            Votre parcelle n'est pas impactée par le classement sonore.
          </Text>
        )}
      </View>
      {soundClassification.exposed ? (
        <>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow} wrap={false}>
              <Text style={[styles.th, styles.colType]}>Type de source</Text>
              <Text style={[styles.th, styles.colName]}>Nom de la source</Text>
              <Text style={[styles.th, styles.colCat]}>Catégorie</Text>
              <Text style={[styles.th, styles.colDist]}>Distance minimum**</Text>
              <Text style={[styles.th, styles.colDist]}>Distance maximum**</Text>
            </View>
            {rows.map((r, i) => (
              <View key={i} style={styles.tableRow} wrap={false}>
                <Text style={[styles.td, styles.colType]}>{r.type}</Text>
                <Text style={[styles.td, styles.colName]}>{r.name}</Text>
                <Text style={[styles.td, styles.colCat]}>{r.category}</Text>
                <Text style={[styles.td, styles.colDist]}>{r.minDistance} mètres</Text>
                <Text style={[styles.td, styles.colDist]}>{r.maxDistance} mètres</Text>
              </View>
            ))}
          </View>
          <Text style={styles.tableNote}>
            *Échelle de 1 à 5. La catégorie 1 est la plus bruyante.{"\n"}
            **Distances estimées à partir du centre de la source de bruit et le point le plus prêt et le plus éloigné de votre parcelle.
          </Text>
        </>
      ) : null}
      <ReferencesBox links={TERRESTRE_REFERENCES} />
    </View>
  );
}
