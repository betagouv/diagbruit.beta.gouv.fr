import type { ReactNode } from "react";
import { Text, View } from "@react-pdf/renderer";
import { styles } from "./DiagnosticPdf";

type InfoProps = {
  title: string;
  icon: ReactNode;
  barColor: string;
  titleColor?: string;
  children: ReactNode;
};

export default function Info({
  title,
  icon,
  barColor,
  titleColor,
  children,
}: InfoProps) {
  return (
    <View style={styles.info}>
      <View style={[styles.infoHeader, { backgroundColor: barColor }]}>
        {icon}
        <Text
          style={
            titleColor ? [styles.infoTitle, { color: titleColor }] : styles.infoTitle
          }
        >
          {title}
        </Text>
      </View>
      <View style={styles.infoBody}>{children}</View>
    </View>
  );
}
