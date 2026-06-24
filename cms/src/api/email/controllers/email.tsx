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
import DiagnosticPdf, { type DiagnosticPdfData } from "../templates/DiagnosticPdf";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_LINK_ORIGINS = [
  "https://diagbruit.beta.gouv.fr",
  "https://diagbruit.fr",
  "https://preprod.diagbruit.fr",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

function isValidEmail(email: string): boolean {
  return (
    typeof email === "string" && EMAIL_REGEX.test(email) && email.length <= 254
  );
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
      };
      pdfUrl = await generateAndUploadDiagnosticPdf(pdfData);
    }

    const html = await render(
      <DiagnosticEmail diagLink={link} pdfUrl={pdfUrl ?? undefined} />,
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
