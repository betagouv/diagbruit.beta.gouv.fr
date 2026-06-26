import { Text, View } from "@react-pdf/renderer";
import { styles, type NoiseMapData } from "./DiagnosticPdf";

// Column widths for the 5-column synthesis table (flex ratios).
const col = {
  type: { flex: 1.2 },
  producer: { flex: 1.2 },
  name: { flex: 1.4 },
  day: { flex: 1.4 },
  night: { flex: 1.4 },
};

// "Cartes de bruit" synthesis table — one row per noise source, mirroring the
// frontend's DiagnosticEvaluation table.
export default function NoiseMap({ noiseMap }: { noiseMap: NoiseMapData }) {
  if (!noiseMap || noiseMap.rows.length === 0) return null;
  return (
    <View style={styles.regSection}>
      <Text style={styles.title}>Cartes de bruit</Text>
      <View style={[styles.table, { marginTop: 12 }]}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, col.type]}>Type de source</Text>
          <Text style={[styles.th, col.producer]}>Producteur</Text>
          <Text style={[styles.th, col.name]}>Nom de la source</Text>
          <Text style={[styles.th, col.day]}>Niveau de bruit (jour)</Text>
          <Text style={[styles.th, col.night]}>Niveau de bruit (nuit)</Text>
        </View>
        {noiseMap.rows.map((r, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.td, col.type]}>{r.type}</Text>
            <Text style={[styles.td, col.producer]}>{r.producer}</Text>
            <Text style={[styles.td, col.name]}>{r.name}</Text>
            <Text style={[styles.td, col.day]}>{r.dayLevel}</Text>
            <Text style={[styles.td, col.night]}>{r.nightLevel}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
