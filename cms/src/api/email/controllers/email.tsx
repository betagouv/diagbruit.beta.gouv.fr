/**
 * email controller
 */

import { renderToBuffer } from "@react-pdf/renderer";
import { render } from "@react-email/render";
import { factories } from "@strapi/strapi";
import { randomUUID } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import DiagnosticEmail from "../templates/DiagnosticEmail";
import DiagnosticPdf, {
  type DiagnosticPdfData,
  type IsolationData,
  type NoiseMapData,
  type NoiseSourceGroup,
  type PluData,
  type PositionData,
  type RegulationData,
} from "../templates/DiagnosticPdf";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PARCEL_NUMBER_REGEX = /^\d{5}-[0-9A-Z]{1,3}-\d{4}$/;
const ALLOWED_LINK_ORIGINS = [
  "https://diagbruit.beta.gouv.fr",
  "https://diagbruit.fr",
  "https://preprod.diagbruit.fr",
  process.env.NODE_ENV === "development" && "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

function isValidEmail(email: string): boolean {
  return (
    typeof email === "string" && EMAIL_REGEX.test(email) && email.length <= 254
  );
}

function isValidParcelNumber(parcelNumber: string): boolean {
  return typeof parcelNumber === "string" && PARCEL_NUMBER_REGEX.test(parcelNumber);
}

function isAllowedLink(link: string): boolean {
  try {
    const url = new URL(link);
    return ALLOWED_LINK_ORIGINS.some((origin) => url.origin === origin);
  } catch {
    return false;
  }
}

async function generateAndUploadDiagnosticPdf(
  data: DiagnosticPdfData,
): Promise<string | null> {
  let tmpPath: string | null = null;
  try {
    const buffer = await renderToBuffer(<DiagnosticPdf data={data} />);

    const safeParcel =
      String(data.parcelNumber || "diagnostic").replace(/[^a-zA-Z0-9-]/g, "") ||
      "diagnostic";
    const displayName = `diagnostic-${safeParcel}.pdf`;

    tmpPath = path.join(os.tmpdir(), `${randomUUID()}.pdf`);
    await fs.promises.writeFile(tmpPath, buffer);

    const [uploaded] = await strapi.plugins.upload.services.upload.upload({
      data: {
        fileInfo: { name: displayName, caption: "", alternativeText: "" },
        path: "diag",
      },
      files: {
        filepath: tmpPath,
        originalFilename: displayName,
        mimetype: "application/pdf",
        size: buffer.length,
      },
    });

    const uploadedUrl = uploaded?.url ?? null;
    if (!uploadedUrl) return null;

    if (uploadedUrl.startsWith("/")) {
      const base = (process.env.STRAPI_URL || "http://localhost:1337").replace(/\/+$/, "");
      return `${base}${uploadedUrl}`;
    }
    return uploadedUrl;
  } catch (err) {
    strapi.log.error(`[email] diagnostic PDF generation/upload failed: ${err}`);
    return null;
  } finally {
    if (tmpPath) {
      fs.promises.unlink(tmpPath).catch(() => { });
    }
  }
}


function coerceRegulation(raw: any): RegulationData | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const zone = raw.peb?.zone;
  const rows = Array.isArray(raw.soundClassification?.rows)
    ? raw.soundClassification.rows.slice(0, 50).map((r: any) => ({
      type: String(r?.type ?? ""),
      name: String(r?.name ?? "-"),
      category: r?.category ?? "",
      minDistance: Number(r?.minDistance) || 0,
      maxDistance: Number(r?.maxDistance) || 0,
    }))
    : [];
  return {
    peb: {
      exposed: Boolean(raw.peb?.exposed),
      zone: ["A", "B", "C", "D"].includes(zone) ? zone : null,
    },
    soundClassification: {
      exposed: Boolean(raw.soundClassification?.exposed),
      rows,
    },
  };
}

/** Coerce the client-provided noise-map table rows into NoiseMapData. */
function coerceNoiseMap(raw: any): NoiseMapData | undefined {
  const rows = Array.isArray(raw?.rows)
    ? raw.rows.slice(0, 50).map((r: any) => ({
      type: String(r?.type ?? ""),
      producer: String(r?.producer ?? ""),
      name: String(r?.name ?? "-"),
      dayLevel: String(r?.dayLevel ?? "-"),
      nightLevel: String(r?.nightLevel ?? "-"),
    }))
    : [];
  if (rows.length === 0) return undefined;
  return { rows };
}

/** Coerce the client-provided parcelle position diagram (pre-computed SVG). */
function coercePosition(raw: any): PositionData | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const size = Number(raw.size) || 400;
  const parcellePoints = Array.isArray(raw.parcellePoints)
    ? raw.parcellePoints.slice(0, 50).map((p: any) => String(p ?? ""))
    : [];
  if (parcellePoints.length === 0) return undefined;
  const zones = Array.isArray(raw.zones)
    ? raw.zones.slice(0, 100).map((z: any) => ({
        d: String(z?.d ?? ""),
        fill: String(z?.fill ?? "#000000"),
      }))
    : [];
  const optimalPoints = Array.isArray(raw.optimalPoints)
    ? raw.optimalPoints.slice(0, 2000).map((pt: any) => ({
        x: Number(pt?.x) || 0,
        y: Number(pt?.y) || 0,
      }))
    : [];
  return { size, parcellePoints, zones, optimalPoints };
}

/** Coerce the client-provided nearby noise-source groups (category + count). */
function coerceNoiseSources(raw: any): NoiseSourceGroup[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const groups = raw
    .slice(0, 20)
    .map((g: any) => ({
      name: String(g?.name ?? "").trim(),
      slug: String(g?.slug ?? "").trim(),
      count: Math.max(0, Math.floor(Number(g?.count) || 0)),
    }))
    .filter((g: NoiseSourceGroup) => g.name.length > 0 && g.count > 0);
  return groups.length > 0 ? groups : undefined;
}

/**
 * Validate the client-captured map image. Only accept a JPEG/PNG data-URI and
 * cap its size so a malformed/oversized payload can't bloat the PDF.
 */
function coerceMapImage(raw: any): string | undefined {
  if (typeof raw !== "string") return undefined;
  if (!/^data:image\/(jpeg|png);base64,/.test(raw)) return undefined;
  // ~1.5 MB of base64 upper bound.
  if (raw.length > 1_500_000) return undefined;
  return raw;
}

function coerceIsolation(raw: any): IsolationData | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const num = (v: any) =>
    v != null && !Number.isNaN(Number(v)) ? Number(v) : null;
  return {
    min: num(raw.min),
    max: num(raw.max),
    hasPeb: Boolean(raw.hasPeb),
    hasCls: Boolean(raw.hasCls),
  };
}


async function buildPluData(
  raw: any,
  codeInsee: string,
): Promise<PluData> {
  const zones = Array.isArray(raw?.zones)
    ? raw.zones
      .slice(0, 20)
      .map((z: any) => ({
        label: String(z?.label ?? ""),
        content: String(z?.content ?? ""),
        source: String(z?.source ?? ""),
        reference: String(z?.reference ?? ""),
      }))
      .filter((z: { content: string }) => z.content.trim().length > 0)
    : [];

  let references: { label: string; url: string }[] = [];
  if (codeInsee) {
    try {
      const docs = await strapi
        .documents("api::local-documentation.local-documentation")
        .findMany({
          filters: { codeinsees: { codeinsee: { $eq: codeInsee } } },
          populate: "*",
        });
      references = (docs ?? [])
        .filter((d: any) => d?.link)
        .sort((a: any, b: any) => (a.priority ?? 0) - (b.priority ?? 0))
        .map((d: any) => ({ label: String(d.name), url: String(d.link) }));
    } catch (err) {
      strapi.log.warn(`[email] PLU references fetch failed: ${err}`);
    }
  }

  return { zones, references };
}

export default factories.createCoreController("api::email.email", () => ({
  async subscribe(ctx) {
    const { email, profile } = ctx.request.body;

    if (!email || !profile) {
      return ctx.badRequest("Missing email or profile");
    }

    if (!isValidEmail(email)) {
      return ctx.badRequest("Invalid email address");
    }

    const existing = await strapi.documents("api::email.email").findMany({
      filters: { email },
    });

    if (existing.length > 0) {
      const doc = existing[0];
      await strapi.documents("api::email.email").update({
        documentId: doc.documentId,
        data: { count: (doc.count || 0) + 1 },
      });
      return ctx.send({
        message: "Email already registered, count incremented",
      });
    }

    await strapi.documents("api::email.email").create({
      data: { email, profile, count: 1, publishedAt: new Date() },
    });

    return ctx.send({ message: "Email registered successfully" });
  },

  async send(ctx) {
    const { to, link, parcelNumber } = ctx.request.body;

    if (!to) {
      return ctx.badRequest('Missing "to" field');
    }

    if (!isValidEmail(to)) {
      return ctx.badRequest("Invalid email address");
    }

    if (!link || !isAllowedLink(link)) {
      return ctx.badRequest("Invalid or disallowed link");
    }

    if (!parcelNumber || !isValidParcelNumber(parcelNumber)) {
      return ctx.badRequest("Invalid parcel number");
    }

    let pdfUrl: string | null = null;
    const { summary } = ctx.request.body;
    if (summary && typeof summary === "object") {
      const pdfData: DiagnosticPdfData = {
        parcelNumber: String(parcelNumber ?? ""),
        score: Number(summary.score) || 0,
        maxDbLden:
          summary.maxDbLden != null && !Number.isNaN(Number(summary.maxDbLden))
            ? Number(summary.maxDbLden)
            : null,
        flags: {
          isMultiExposedSources: Boolean(summary.flags?.isMultiExposedSources),
          isPriorityZone: Boolean(summary.flags?.isPriorityZone),
          hasClassificationWarning: Boolean(summary.flags?.hasClassificationWarning),
        },
        link,
        generatedAt: new Date().toLocaleDateString("fr-FR"),
        address:
          typeof summary.address === "string" && summary.address.trim()
            ? summary.address.trim()
            : null,
        regulation: coerceRegulation(summary.regulation),
        isolation: coerceIsolation(summary.isolation),
        plu: await buildPluData(
          summary.plu,
          String(parcelNumber ?? "").split("-")[0],
        ),
        noiseMap: coerceNoiseMap(summary.noiseMap),
        noiseSources: coerceNoiseSources(summary.noiseSources),
        position: coercePosition(summary.position),
        mapImage: coerceMapImage(summary.mapImage),
      };
      pdfUrl = await generateAndUploadDiagnosticPdf(pdfData);
    }

    const html = await render(
      <DiagnosticEmail diagLink={link} pdfUrl={pdfUrl ?? undefined} parcelNumber={parcelNumber} />,
    );

    await strapi.plugins.email.services.email.send({
      to,
      bcc: "contact@diagbruit.fr",
      subject: `Votre diagnostic acoustique diagBruit - Parcelle ${parcelNumber}`,
      html,
    });

    return ctx.send({ message: "Email envoyé avec succès" });
  },
}));
