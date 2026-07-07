/* eslint-disable */
/**
 * Build-time sitemap + robots.txt generator, run by `yarn build` before
 * react-scripts build (so CRA copies the files into build/).
 *
 * Needs, at build time:
 *   - REACT_APP_CMS_URL     : Strapi base URL (to list preco slugs)
 *   - REACT_APP_SITE_URL    : public site origin used in <loc>
 *   - REACT_APP_ENVIRONMENT : "production" enables indexing; anything else
 *                             writes a Disallow-all robots.txt
 *
 * CMS errors are soft (sitemap falls back to the static routes); any other
 * error fails the build rather than shipping a robots.txt that advertises a
 * missing sitemap.
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// seo.js reads process.env at require time — keep this after dotenv.config.
const {
  SITE_URL,
  IS_INDEXABLE,
  PUBLIC_ROUTES,
} = require(path.resolve(__dirname, "..", "src", "config", "seo"));

const CMS_URL = (
  process.env.REACT_APP_CMS_URL || "http://localhost:1337"
).replace(/\/+$/, "");

const FETCH_TIMEOUT_MS = 10_000;

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
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`CMS responded ${res.status}`);
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    for (const item of data) {
      if (item.slug) slugs.push({ slug: item.slug, updatedAt: item.updatedAt });
    }
    const pageCount = json.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page++;
  }
  return slugs;
}

function urlEntry(loc, lastmod) {
  const date = lastmod ? new Date(lastmod) : null;
  const lm =
    date && !Number.isNaN(date.getTime())
      ? `\n    <lastmod>${date.toISOString().slice(0, 10)}</lastmod>`
      : "";
  return `  <url>\n    <loc>${loc}</loc>${lm}\n  </url>`;
}

function writeRobots() {
  const body = IS_INDEXABLE
    ? ["User-agent: *", "Disallow:", "", `Sitemap: ${SITE_URL}/sitemap.xml`]
    : ["User-agent: *", "Disallow: /"];
  const content =
    "# https://www.robotstxt.org/robotstxt.html\n" + body.join("\n") + "\n";
  const out = path.join(__dirname, "..", "public", "robots.txt");
  fs.writeFileSync(out, content, "utf-8");
  console.log(
    `[robots] ${IS_INDEXABLE ? "allow + sitemap" : "Disallow: / (non-production env)"} -> ${out}`,
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
    ...Object.values(PUBLIC_ROUTES).map((r) => urlEntry(`${SITE_URL}${r}`)),
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
  console.error(`[sitemap] generation failed: ${err.message}`);
  process.exitCode = 1;
});
