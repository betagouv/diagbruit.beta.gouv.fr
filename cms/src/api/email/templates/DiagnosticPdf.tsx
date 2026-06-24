import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

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
}


export default function DiagnosticPdf({ data }: { data: DiagnosticPdfData }) {
  return (
    <Document title={`Diagnostic acoustique - ${data.parcelNumber}`}>
      <Page >
        <View >
          <Text >diagBruit</Text>
          <Text>Test</Text>
        </View>


      </Page>
    </Document>
  );
}
