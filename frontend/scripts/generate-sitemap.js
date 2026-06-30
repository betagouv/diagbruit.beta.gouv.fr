/* eslint-disable */
/**
 * Build-time sitemap generator.
 *
 * Writes public/sitemap.xml with the static routes plus one entry per
 * published "préconisation" (fetched from Strapi). Runs as part of `yarn build`
 * (before react-scripts build, so CRA copies the file into build/).
 *
 * Needs, at build time:
 *   - REACT_APP_CMS_URL  : Strapi base URL (to list preco slugs)
 *   - REACT_APP_SITE_URL : public site origin used in <loc> (defaults to prod)
 * If the CMS is unreachable, it still writes a sitemap with the static routes
 * so the build never fails over SEO metadata.
 */
const fs = require("fs");
const path = require("path");

try {
  const dotenv = require("dotenv");
  dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
  dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
} catch (_) {
  /* dotenv not installed — rely on the process environment */
}

const SITE_URL = (
  process.env.REACT_APP_SITE_URL || "https://diagbruit.beta.gouv.fr"
).replace(/\/+$/, "");
const CMS_URL = (
  process.env.REACT_APP_CMS_URL || "http://localhost:1337"
).replace(/\/+$/, "");

const NOINDEX_ENVS = ["test", "preprod", "staging", "development", "dev", "local"];
const IS_NOINDEX = NOINDEX_ENVS.includes(
  (process.env.REACT_APP_ENVIRONMENT || "").toLowerCase(),
);

const STATIC_ROUTES = [
  "/",
  "/preco",
  "/changelogs",
  "/stats",
  "/accessibility",
  "/legal-mentions",
  "/privacy-policy",
];

async function fetchAllRecoSlugs() {
  const slugs = [];
  let page = 1;
  const pageSize = 100;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const url =
      `${CMS_URL}/api/recommendations` +
      `?fields[0]=slug&fields[1]=updatedAt` +
      `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CMS responded ${res.status}`);
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    for (const item of data) {
      // Strapi v5 flattens fields; fall back to v4 attributes just in case.
      const slug = item.slug ?? item.attributes?.slug;
      const updatedAt = item.updatedAt ?? item.attributes?.updatedAt;
      if (slug) slugs.push({ slug, updatedAt });
    }
    const pageCount = json.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page++;
  }
  return slugs;
}

function urlEntry(loc, lastmod) {
  const lm = lastmod
    ? `\n    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>`
    : "";
  return `  <url>\n    <loc>${loc}</loc>${lm}\n  </url>`;
}

function writeRobots() {
  const body = IS_NOINDEX
    ? ["User-agent: *", "Disallow: /"]
    : ["User-agent: *", "Disallow:", "", `Sitemap: ${SITE_URL}/sitemap.xml`];
  const content =
    "# https://www.robotstxt.org/robotstxt.html\n" + body.join("\n") + "\n";
  const out = path.join(__dirname, "..", "public", "robots.txt");
  fs.writeFileSync(out, content, "utf-8");
  console.log(
    `[robots] ${IS_NOINDEX ? "Disallow: / (noindex env)" : "allow + sitemap"} -> ${out}`,
  );
}

writeRobots();

(async () => {
  let recos = [];
  try {
    recos = await fetchAllRecoSlugs();
    console.log(`[sitemap] fetched ${recos.length} préconisation slugs`);
  } catch (err) {
    console.warn(
      `[sitemap] could not fetch préconisations (${err.message}); ` +
        `writing static routes only`,
    );
  }

  const entries = [
    ...STATIC_ROUTES.map((r) => urlEntry(`${SITE_URL}${r}`)),
    ...recos.map((r) =>
      urlEntry(`${SITE_URL}/preco/${encodeURIComponent(r.slug)}`, r.updatedAt),
    ),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${entries.join("\n")}\n` +
    `</urlset>\n`;

  const out = path.join(__dirname, "..", "public", "sitemap.xml");
  fs.writeFileSync(out, xml, "utf-8");
  console.log(`[sitemap] wrote ${entries.length} urls -> ${out}`);
})().catch((err) => {
  console.warn(`[sitemap] generation skipped: ${err.message}`);
});
