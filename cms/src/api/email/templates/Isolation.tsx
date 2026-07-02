import { Text, View } from "@react-pdf/renderer";
import ExposureBadge from "./ExposureBadge";
import { styles, type IsolationData } from "./DiagnosticPdf";

export default function Isolation({ isolation }: { isolation: IsolationData }) {
  const { min, max, hasPeb, hasCls } = isolation;
  const hasIsolation = max != null && max > 30;

  const exposureText =
    hasPeb && hasCls
      ? "Vous êtes soumis au bruit aérien et au classement sonore"
      : hasPeb
        ? "Vous êtes soumis au bruit aérien"
        : "Vous êtes soumis au classement sonore";

  return (
    <View style={styles.regSection} wrap={false}>
      <View style={styles.regSectionHeader}>
        <Text style={styles.regSectionTitle}>Isolation réglementaire</Text>
        <ExposureBadge exposed={hasIsolation} />
      </View>
      <View style={styles.regCard}>
        {hasIsolation ? (
          min !== max ? (
            <Text style={styles.regParagraph}>
              {exposureText}, vous avez une obligation d'isolation réglementaire
              entre <Text style={styles.bold}>{min} et {max} dB</Text> selon la
              position du bâti.
            </Text>
          ) : (
            <Text style={styles.regParagraph}>
              {exposureText}, vous avez une obligation d'isolation réglementaire
              de <Text style={styles.bold}>{max} dB</Text>.
            </Text>
          )
        ) : (
          <Text style={styles.regParagraph}>
            Votre parcelle n'est pas soumise à une isolation réglementaire.
            L'isolation acoustique minimale de{" "}
            <Text style={styles.bold}>30 dB</Text> est obligatoire selon la
            réglementation en vigueur.
          </Text>
        )}
      </View>
    </View>
  );
}
