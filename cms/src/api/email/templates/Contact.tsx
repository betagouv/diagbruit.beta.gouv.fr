import { Link, Path, Svg, Text, View } from "@react-pdf/renderer";
import { styles } from "./DiagnosticPdf";

const CONTACT_EMAIL = "contact@diagbruit.fr";
const CUSTOMER_SERVICE_PATH =
  "M22 17.002a6.002 6.002 0 0 1-4.713 5.86l-.638-1.914A4.003 4.003 0 0 0 19.465 19H17a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2.938a8.001 8.001 0 0 0-15.876 0H7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5C2 6.477 6.477 2 12 2s10 4.477 10 10v5.002Z";

export default function Contact() {
  return (
    <View style={styles.contactBox}>
      <View style={styles.recoHeader}>
        <Svg style={styles.contactIcon} viewBox="0 0 24 24">
          <Path d={CUSTOMER_SERVICE_PATH} fill="#000091" />
        </Svg>
        <Text style={styles.recoTitle}>Conseils diagBruit</Text>
      </View>
      <Text style={styles.recoParagraph}>
        Vous avez une question concernant votre diagnostic acoustique,
        l'interprétation de vos résultats ou les démarches à suivre ? L'équipe
        de diagBruit est à votre disposition pour vous accompagner et répondre à
        vos interrogations. N'hésitez pas à nous contacter par email à l'adresse
        suivante :
      </Text>
      <Link src={`mailto:${CONTACT_EMAIL}`} style={styles.contactLink}>
        {CONTACT_EMAIL}
      </Link>
    </View>
  );
}
