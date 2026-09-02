import type { ReactNode } from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import ExposureBadge from "./ExposureBadge";
import {
  ReferencesBox,
  renderRuns,
  styles,
  type PluData,
  type PluZone,
  type Run,
} from "./DiagnosticPdf";


const decodeEntities = (s: string) =>
  s
    .replace(/&nbsp;/gi, " ")
    .replace(/&laquo;/gi, "«")
    .replace(/&raquo;/gi, "»")
    .replace(/&rsquo;|&apos;/gi, "’")
    .replace(/&hellip;/gi, "…")
    .replace(/&quot;/gi, '"')
    // numeric entities (decimal &#233; / hex &#xE9;) — covers accented chars
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");

const stripEmoji = (s: string) =>
  s.replace(
    /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}\u{2190}-\u{21FF}️‍]/gu,
    "",
  );

const cleanText = (s: string) =>
  stripEmoji(decodeEntities(s.replace(/<[^>]+>/g, " "))).replace(/\s+/g, " ");

const parseInline = (html: string): Run[] => {
  const runs: Run[] = [];
  let boldDepth = 0;
  const tagRe = /<\/?(strong|b|em|i)\b[^>]*>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html))) {
    const chunk = html.slice(last, m.index);
    if (chunk) runs.push({ text: cleanText(chunk), bold: boldDepth > 0 });
    const tag = m[1].toLowerCase();
    const closing = m[0].startsWith("</");
    if (tag === "strong" || tag === "b") boldDepth += closing ? -1 : 1;
    last = tagRe.lastIndex;
  }
  const tail = html.slice(last);
  if (tail) runs.push({ text: cleanText(tail), bold: boldDepth > 0 });
  const kept = runs.filter((r) => r.text.trim().length > 0);
  if (kept.length) {
    kept[0] = { ...kept[0], text: kept[0].text.replace(/^\s+/, "") };
    const lastRun = kept[kept.length - 1];
    kept[kept.length - 1] = { ...lastRun, text: lastRun.text.replace(/\s+$/, "") };
  }
  return kept;
};

const renderListItemRuns = (runs: Run[]) =>
  runs.map((r, i) =>
    r.bold ? (
      <Text key={i} style={styles.bold}>
        {r.text}
      </Text>
    ) : (
      r.text
    ),
  );

const parseHtml = (html: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  let key = 0;
  const blockRe = /<(p|ul|ol)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let matched = false;
  let lastEnd = 0;
  let m: RegExpExecArray | null;

  const pushParagraph = (fragment: string) => {
    const runs = parseInline(fragment);
    if (runs.length) nodes.push(renderRuns(runs, key++));
  };

  while ((m = blockRe.exec(html))) {
    matched = true;
    const loose = html.slice(lastEnd, m.index).trim();
    if (loose) pushParagraph(loose);

    const tag = m[1].toLowerCase();
    if (tag === "ul" || tag === "ol") {
      const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
      let li: RegExpExecArray | null;
      const items: ReactNode[] = [];
      while ((li = liRe.exec(m[2]))) {
        const runs = parseInline(li[1]);
        if (!runs.length) continue;
        items.push(
          <View key={items.length} style={styles.listItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.listText}>{renderListItemRuns(runs)}</Text>
          </View>,
        );
      }
      if (items.length) {
        nodes.push(
          <View key={key++} style={styles.ul}>
            {items}
          </View>,
        );
      }
    } else {
      pushParagraph(m[2]);
    }
    lastEnd = blockRe.lastIndex;
  }

  if (!matched) {
    pushParagraph(html);
  } else {
    const tail = html.slice(lastEnd).trim();
    if (tail) pushParagraph(tail);
  }
  return nodes;
};

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const PLU_LOGO = `${STRAPI_URL}/images/location_city.svg`;

const PluCard = ({ zone }: { zone: PluZone }) => (
  <View style={styles.regCard} wrap={false}>
    <View style={styles.badgeRow}>
      <Text style={styles.sourceBadge}>
        Source : {zone.source || "Plan local d'urbanisme"}
      </Text>
    </View>
    {parseHtml(zone.content)}
  </View>
);

export default function Plu({ plu }: { plu?: PluData }) {
  const zones = plu?.zones ?? [];
  const display = zones.length === 0;
  return (
    <View style={styles.regSection}>
      <View wrap={false}>
        <View style={styles.regSectionHeader}>
          <View style={styles.regSectionHeaderLeft}>
            <Image src={PLU_LOGO} style={styles.regIcon} />
            <Text style={styles.regSectionTitle}>Locales (PLU)</Text>
          </View>
          <ExposureBadge exposed={!display} />
        </View>
        {display ? (
          <Text style={styles.regIntro}>
            Aucune spécificité locale inscrite au PLU.
          </Text>
        ) : (
          <PluCard zone={zones[0]} />
        )}
      </View>
      {zones.slice(1).map((zone, i) => (
        <PluCard key={i} zone={zone} />
      ))}
      {plu && plu.references.length > 0 && <ReferencesBox links={plu.references} />}
    </View>
  );
}
