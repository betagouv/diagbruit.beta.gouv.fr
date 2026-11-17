import { Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import { styles } from "./DiagnosticPdf";

const PRECO_URL = "https://diagbruit.beta.gouv.fr/preco";

// Static "Préconisations" section shown under the position diagram: simple
// design-stage measures to limit noise, plus a link to the full guide.
export default function Preconisations() {
  return (
    <View style={s.section} wrap={false}>
      <Text style={s.title}>Préconisations</Text>
      <Text style={s.intro}>
        Pour limiter les nuisances sonores, certaines mesures simples peuvent
        être intégrées dès la conception du projet.
      </Text>

      <View style={s.bullet}>
        <Text style={s.dot}>•</Text>
        <Text style={s.bulletText}>
          <Text style={styles.bold}>Privilégier des isolants fibreux,</Text>{" "}
          plus performants pour absorber les bruits que les isolants rigides.
        </Text>
      </View>
      <View style={s.bullet}>
        <Text style={s.dot}>•</Text>
        <Text style={s.bulletText}>
          Installer{" "}
          <Text style={styles.bold}>
            un double vitrage acoustique associant deux épaisseurs de verre
            différentes
          </Text>{" "}
          afin d'améliorer l'isolation phonique.
        </Text>
      </View>
      <View style={s.bullet}>
        <Text style={s.dot}>•</Text>
        <Text style={s.bulletText}>
          <Text style={styles.bold}>
            Soigner l'étanchéité à l'air lors de la pose des fenêtres
          </Text>{" "}
          pour limiter les infiltrations de bruit.
        </Text>
      </View>
      <View style={s.bullet}>
        <Text style={s.dot}>•</Text>
        <Text style={s.bulletText}>
          <Text style={styles.bold}>
            Désolidariser le caisson de VMC du bâti
          </Text>{" "}
          et équilibrer les débits de ventilation afin de réduire la
          transmission des vibrations et du bruit.
        </Text>
      </View>

      <Text style={s.footer}>
        Rendez-vous sur pour accédez à plus de conseils :{" "}
        <Link src={PRECO_URL} style={s.link}>
          diagbruit.beta.gouv.fr/preco
        </Link>
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  title: {
    fontSize: 12,
    fontFamily: "Marianne",
    fontWeight: 700,
    color: "#161616",
    marginBottom: 8,
  },
  intro: {
    fontSize: 10,
    fontFamily: "Marianne",
    lineHeight: 1.5,
    marginBottom: 8,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 8,
  },
  dot: {
    fontSize: 10,
    marginRight: 8,
    lineHeight: 1.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Marianne",
    lineHeight: 1.5,
  },
  footer: {
    fontSize: 10,
    fontFamily: "Marianne",
    lineHeight: 1.5,
    marginTop: 8,
  },
  link: {
    color: "#000091",
    fontFamily: "Marianne",
    fontWeight: 700,
    textDecoration: "underline",
  },
});
