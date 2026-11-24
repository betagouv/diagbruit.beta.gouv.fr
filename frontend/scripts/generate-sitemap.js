/* eslint-disable */
/**
 * Build-time SEO files, run twice by `yarn build`:
 *
 *  - `node scripts/generate-sitemap.js` (before react-scripts build):
 *    sitemap.xml + robots.txt in public/, which CRA copies into build/.
 *
 *  - `node scripts/generate-sitemap.js --html` (after react-scripts build):
 *    one HTML file per public page (build/<route>.html and
 *    build/preco/<slug>.html), copies of build/index.html with that page's
 *    <title>, description, Open Graph / Twitter tags, canonical and JSON-LD.
 *    The app is a client-side SPA: without these files every URL serves the
 *    same index.html and crawlers that do not run JS (or before Google renders
 *    it) only see the generic description. usePageMeta keeps updating the same
 *    tags in the browser.
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
  PAGE_META,
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

async function generateSitemap() {
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
}

const APP_NAME = "diagBruit";
const BUILD_DIR = path.join(__dirname, "..", "build");
const PRECO_DESCRIPTION_LENGTH = 160;
// Slugs become directory names: only accept plain ones.
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function fetchAllRecos() {
  const recos = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const url =
      `${CMS_URL}/api/recommendations` +
      `?fields[0]=slug&fields[1]=title&fields[2]=content&fields[3]=aRetenir` +
      `&fields[4]=updatedAt&populate[0]=imageBanner` +
      `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`CMS responded ${res.status}`);
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [];
    recos.push(...data.filter((item) => item.slug));
    const pageCount = json.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page++;
  }
  return recos;
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Same text as the preco page's description (src/pages/preco.tsx), without the
// browser's DOMParser: tags stripped, common entities decoded, spaces collapsed.
const htmlToText = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "’")
    // Last, so "&amp;lt;" gives "&lt;" (the text) and not "<".
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const cmsAssetUrl = (url) => (url && url.startsWith("/") ? `${CMS_URL}${url}` : url);

/**
 * Head tags of one page. Element ids/attributes match what usePageMeta looks
 * up, so in the browser it updates these tags instead of duplicating them.
 */
function buildHeadTags({ title, description, canonical, type = "website", image, jsonLd }) {
  const fullTitle = `${title} - ${APP_NAME}`;
  const meta = (key, name, content) =>
    content ? `<meta ${key}="${name}" content="${escapeHtml(content)}"/>` : "";
  return {
    title: `<title>${escapeHtml(fullTitle)}</title>`,
    description: meta("name", "description", description),
    extra: [
      canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}"/>` : "",
      meta("property", "og:site_name", APP_NAME),
      meta("property", "og:title", fullTitle),
      meta("property", "og:description", description),
      meta("property", "og:type", type),
      meta("property", "og:url", canonical),
      meta("property", "og:image", image),
      meta("name", "twitter:card", image ? "summary_large_image" : "summary"),
      meta("name", "twitter:title", fullTitle),
      meta("name", "twitter:description", description),
      meta("name", "twitter:image", image),
      jsonLd
        ? `<script type="application/ld+json" id="page-jsonld">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`
        : "",
    ]
      .filter(Boolean)
      .join(""),
  };
}

function renderPage(template, page) {
  const tags = buildHeadTags(page);
  const titleRe = /<title>[\s\S]*?<\/title>/;
  const descriptionRe = /<meta[^>]*name="description"[^>]*>/;
  if (!titleRe.test(template) || !descriptionRe.test(template)) {
    throw new Error("build/index.html has no <title> or description meta to replace");
  }
  // Replacement functions: a CMS title containing "$&", "$1"… must be inserted
  // as is, not read as a replacement pattern.
  return template
    .replace(titleRe, () => tags.title)
    .replace(descriptionRe, () => tags.description)
    .replace("</head>", () => `${tags.extra}</head>`);
}

// File of the home page "/" (build/home.html); build/index.html is the fallback.
const HOME_PAGE = "/home";

// Written as build/<route>.html. Served by `serve build` (Scalingo Procfile)
// through the rewrites of build/serve.json (see writeServeConfig) and by nginx
// (Docker) with `try_files $uri $uri.html /index.html`.
function writePage(route, html) {
  const file = path.join(BUILD_DIR, ...route.split("/").filter(Boolean)) + ".html";
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html, "utf-8");
  return route;
}

/**
 * build/serve.json, read by `serve build`: one rewrite per generated page, then
 * the SPA fallback. Replaces `serve -s`, whose catch-all rewrite comes first and
 * would send every page to index.html.
 *
 * serve applies rewrites one after the other (/diagnostic -> /diagnostic.html,
 * then the remaining rules again), so the fallback only matches paths without a
 * dot: app routes, not the generated .html files nor static assets.
 */
function writeServeConfig(routes) {
  const config = {
    directoryListing: false,
    rewrites: [
      ...routes.map((route) => ({
        source: route,
        destination: `${route === "/" ? HOME_PAGE : route}.html`,
      })),
      { source: "/:path([^.]+)", destination: "/index.html" },
    ],
  };
  fs.writeFileSync(path.join(BUILD_DIR, "serve.json"), JSON.stringify(config, null, 2) + "\n", "utf-8");
}

async function generatePageHtml() {
  const templatePath = path.join(BUILD_DIR, "index.html");
  if (!fs.existsSync(templatePath)) {
    throw new Error(`${templatePath} not found: run react-scripts build first`);
  }
  const template = fs.readFileSync(templatePath, "utf-8");
  let count = 0;
  const routes = [];

  // Static pages that have their metadata in src/config/seo.js.
  // build/index.html stays generic: it is the fallback served for every other
  // URL (pages without metadata here, préconisations published after the build).
  // The home page "/" gets its own file, build/home.html.
  for (const [key, meta] of Object.entries(PAGE_META)) {
    const route = PUBLIC_ROUTES[key];
    if (!route) throw new Error(`PAGE_META.${key} has no matching PUBLIC_ROUTES entry`);
    const html = renderPage(template, { ...meta, canonical: `${SITE_URL}${route}` });
    if (route === "/") {
      writePage(HOME_PAGE, html);
      routes.push("/");
    } else {
      routes.push(writePage(route, html));
    }
    count++;
  }

  // One page per préconisation (CMS errors are soft, like the sitemap).
  let recos = [];
  try {
    recos = await fetchAllRecos();
  } catch (err) {
    console.warn(`[html] could not fetch préconisations (${err.message}); skipping them`);
  }
  for (const reco of recos) {
    if (!SAFE_SLUG.test(reco.slug)) {
      console.warn(`[html] skipping préconisation with unsafe slug: ${reco.slug}`);
      continue;
    }
    const description =
      htmlToText(reco.aRetenir || reco.content).slice(0, PRECO_DESCRIPTION_LENGTH) || undefined;
    const image = cmsAssetUrl(reco.imageBanner?.url);
    routes.push(writePage(
      `/preco/${reco.slug}`,
      renderPage(template, {
        title: reco.title || "Préconisation",
        description,
        canonical: `${SITE_URL}/preco/${reco.slug}`,
        type: "article",
        image,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: reco.title,
          description,
          ...(image ? { image } : {}),
          dateModified: reco.updatedAt,
        },
      }),
    ));
    count++;
  }

  writeServeConfig(routes);
  console.log(`[html] wrote ${count} pages with their metadata + serve.json -> ${BUILD_DIR}`);
}

const main = process.argv.includes("--html")
  ? generatePageHtml
  : async () => {
      writeRobots();
      await generateSitemap();
    };

main().catch((err) => {
  console.error(`[seo] generation failed: ${err.message}`);
  process.exitCode = 1;
});
