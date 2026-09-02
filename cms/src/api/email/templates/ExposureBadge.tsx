import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { styles } from "./DiagnosticPdf";

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const EXPOSED_ICON = `${STRAPI_URL}/images/exposedIcon.svg`;
const NON_EXPOSED_ICON = `${STRAPI_URL}/images/nonExposedIcon.svg`;

export default function ExposureBadge({ exposed }: { exposed: boolean }) {
  return (
    <View style={[exposed ? styles.exposedBadge : styles.nonExposedBadge, s.badge]}>
      <Image style={s.icon} src={exposed ? EXPOSED_ICON : NON_EXPOSED_ICON} />
      <Text>{exposed ? "Parcelle exposée" : "Parcelle non exposée"}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  icon: {
    width: 8,
    height: 8,
  },
});
