import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL } from "../config/seo";

const APP_NAME = "diagBruit";
const JSONLD_ID = "page-jsonld";
// Distinct element from the global noindex meta injected by src/index.tsx,
// so removing the page-level one never drops the env-level one.
const PAGE_ROBOTS_ID = "page-robots";

type PageMetaOptions = {
  /** Absolute image URL for og:image / twitter:image. */
  image?: string;
  /** og:type (e.g. "article" for préconisations). Defaults to "website". */
  type?: string;
  /** Canonical URL. Defaults to the site origin + current pathname. */
  canonical?: string;
  /** Structured data (JSON-LD) injected as a <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown>;
  /** Mark the page noindex (e.g. a not-found state rendered on a 200). */
  noindex?: boolean;
};

const upsertMeta = (
  key: "name" | "property",
  value: string,
  content?: string,
) => {
  const el = document.head.querySelector(`meta[${key}="${value}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (el) {
    el.setAttribute("content", content);
    return;
  }
  const created = document.createElement("meta");
  created.setAttribute(key, value);
  created.setAttribute("content", content);
  document.head.appendChild(created);
};

const upsertCanonical = (href: string) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const upsertPageRobots = (noindex: boolean) => {
  let el = document.getElementById(PAGE_ROBOTS_ID);
  if (!noindex) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", "robots");
    el.id = PAGE_ROBOTS_ID;
    document.head.appendChild(el);
  }
  el.setAttribute("content", "noindex");
};

/**
 * Sets the document title plus SEO/social metadata for the current page.
 * Note: this runs client-side, so it benefits JS-rendering crawlers (Google)
 * and is paired with the build-time sitemap for discovery. Non-JS crawlers /
 * social scrapers need server-side rendering to actually see these tags.
 */
export const usePageMeta = (
  title: string,
  description?: string,
  options: PageMetaOptions = {},
) => {
  const { image, type = "website", canonical, noindex = false } = options;
  const jsonLdStr = options.jsonLd ? JSON.stringify(options.jsonLd) : undefined;
  // From the router, not window.location: the effect must re-run on path
  // change even when every other argument is identical.
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = `${title} - ${APP_NAME}`;
    document.title = fullTitle;

    const canonicalUrl = canonical || `${SITE_URL}${pathname}`;

    upsertMeta("name", "description", description);
    upsertCanonical(canonicalUrl);
    upsertPageRobots(noindex);

    // Open Graph
    upsertMeta("property", "og:site_name", APP_NAME);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", image);

    // Twitter
    upsertMeta(
      "name",
      "twitter:card",
      image ? "summary_large_image" : "summary",
    );
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", image);

    // JSON-LD structured data
    let script = document.getElementById(JSONLD_ID);
    if (jsonLdStr) {
      if (!script) {
        script = document.createElement("script");
        script.setAttribute("type", "application/ld+json");
        script.id = JSONLD_ID;
        document.head.appendChild(script);
      }
      script.textContent = jsonLdStr;
    } else if (script) {
      script.remove();
    }

    return () => {
      document.title = APP_NAME;
    };
  }, [title, description, image, type, canonical, jsonLdStr, noindex, pathname]);
};
