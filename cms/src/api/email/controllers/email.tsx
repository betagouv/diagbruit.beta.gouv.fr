/**
 * email controller
 */

import { render } from "@react-email/render";
import { factories } from "@strapi/strapi";
import DiagnosticEmail from "../templates/DiagnosticEmail";

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
    const { to, link } = ctx.request.body;

    if (!to) {
      return ctx.badRequest('Missing "to" field');
    }

    if (!isValidEmail(to)) {
      return ctx.badRequest("Invalid email address");
    }

    if (!link || !isAllowedLink(link)) {
      return ctx.badRequest("Invalid or disallowed link");
    }

    const html = await render(<DiagnosticEmail diagLink={link} />);

    await strapi.plugins.email.services.email.send({
      to,
      subject: "Votre diagnostic acoustique diagBruit",
      html,
    });

    return ctx.send({ message: "Email envoyé avec succès" });
  },
}));
