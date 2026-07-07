// Shared by the app and scripts/generate-sitemap.js: plain CommonJS so bare
// Node can require it. Reads process.env at require time — the sitemap script
// must run dotenv.config() before requiring this module.

const SITE_URL = (
  process.env.REACT_APP_SITE_URL || "https://diagbruit.beta.gouv.fr"
).replace(/\/+$/, "");

const IS_INDEXABLE = process.env.REACT_APP_ENVIRONMENT === "production";

// Single source for the router (src/index.tsx) and the generated sitemap.xml.
const PUBLIC_ROUTES = {
  home: "/",
  diagnostic: "/diagnostic",
  searchPreco: "/preco",
  changelogs: "/changelogs",
  stats: "/stats",
  accessibility: "/accessibility",
  legalMentions: "/legal-mentions",
  privacyPolicy: "/privacy-policy",
};

module.exports = { SITE_URL, IS_INDEXABLE, PUBLIC_ROUTES };
