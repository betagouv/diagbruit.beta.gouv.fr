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

// Title and description of each page: single source for usePageMeta (in the
// browser) and the per-page HTML generated at build time by
// scripts/generate-sitemap.js --html (what crawlers see without running JS).
// The title is shown as "<title> - diagBruit".
const PAGE_META = {
  home: {
    title: "Accueil",
    description:
      "Intégrez le bruit dans les risques impactant les projets d'aménagement avec diagBruit.",
  },
  diagnostic: {
    title: "Évaluez les enjeux sonores d’une parcelle",
    description:
      "Identifiez les enjeux sonores et les règles acoustiques applicables à votre parcelle.",
  },
  searchPreco: {
    title: "Se protéger du bruit",
    description:
      "Découvrez les règles d'isolation acoustique et les bonnes pratiques pour anticiper les enjeux sonores de votre projet.",
  },
  changelogs: {
    title: "Nouveautés",
    description:
      "Découvrez les dernières mises à jour et améliorations de diagBruit.",
  },
  stats: {
    title: "Statistiques",
    description: "Consultez les statistiques d'usage de diagBruit.",
  },
};

module.exports = { SITE_URL, IS_INDEXABLE, PUBLIC_ROUTES, PAGE_META };
