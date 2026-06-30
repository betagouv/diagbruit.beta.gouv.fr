import fs from "fs";
import path from "path";
import { Image, Link, Text, View } from "@react-pdf/renderer";
import { styles } from "./DiagnosticPdf";

const SITE_URL = "https://diagbruit.beta.gouv.fr";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");
const BANNER_IMAGES = [
  "isolation-conseils-1.png",
  "isolation-conseils-2.png",
  "isolation-conseils-3.png",
]
  .map((name) => path.join(IMAGES_DIR, name))
  .filter((file) => fs.existsSync(file));

export default function IsolationBanner() {
  return (
    <View style={styles.banner}>
      {BANNER_IMAGES.length > 0 && (
        <View style={styles.bannerImageWrap}>
          {BANNER_IMAGES.map((src, i) => (
            <Image key={i} style={styles.bannerImage} src={src} />
          ))}
        </View>
      )}
      <View style={styles.bannerText}>
        <Text style={styles.bannerTitle}>
          Besoin de conseils pour vous isoler du bruit ?
        </Text>
        <Text style={styles.bannerBody}>
          Retrouvez toutes nos Préconisations sur diagBruit
        </Text>
        <Link src={SITE_URL} style={styles.bannerLink}>
          diagbruit.beta.gouv.fr
        </Link>
      </View>
    </View>
  );
}
