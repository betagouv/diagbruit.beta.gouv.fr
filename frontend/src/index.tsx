import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Link as RouterLink, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./index.css";
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import ScrollToTop from "./components/utils/ScrollToTop";
import { useMatomo } from "./hooks/useMatomo";
import PublicLayout from "./layouts/PublicLayout";
import Changelogs from "./pages/changelogs";
import CmsPage from "./pages/cms-page";
import Diagnostic from "./pages/diagnostic";
import Home from "./pages/home";
import Maintenance from "./pages/maintenance";
import PrecoPage from "./pages/preco";
import Stats from "./pages/stats";
import reportWebVitals from "./reportWebVitals";
import SearchPrecoPage from "./pages/searchPreco";
import { PUBLIC_ROUTES } from "./config/seo";


type DsfrRouterLinkProps = Omit<
  React.ComponentProps<typeof RouterLink>,
  "to"
> & { href: string };

const Link = ({ href, ...rest }: DsfrRouterLinkProps) => (
  <RouterLink to={href} {...rest} />
);

declare module "@codegouvfr/react-dsfr/spa" {
  interface RegisterLink {
    Link: typeof Link;
  }
}

startReactDsfr({ defaultColorScheme: "light", Link });

const App = () => {
  // Keep non-production environments (preprod uses REACT_APP_ENVIRONMENT=test)
  // out of search engines: inject a noindex robots meta. No effect in prod.
  useEffect(() => {
    if (process.env.REACT_APP_ENVIRONMENT !== "test") return;
    // Targeted by id: matching meta[name="robots"] could grab the page-level
    // element managed by usePageMeta, which removes it on navigation.
    const GLOBAL_ROBOTS_ID = "global-robots";
    let meta = document.getElementById(
      GLOBAL_ROBOTS_ID,
    ) as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      meta.id = GLOBAL_ROBOTS_ID;
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";
  }, []);

  if (process.env.NODE_ENV === "production") {
    useMatomo();
  }

  return (
    <PublicLayout>
      <ScrollToTop />
      <Routes>
        <Route path={PUBLIC_ROUTES.home} element={<Home />} />
        <Route path={PUBLIC_ROUTES.diagnostic} element={<Diagnostic />} />
        <Route path={PUBLIC_ROUTES.changelogs} element={<Changelogs />} />
        <Route path={PUBLIC_ROUTES.stats} element={<Stats />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/preco/:slug" element={<PrecoPage />} />
        <Route path={PUBLIC_ROUTES.searchPreco} element={<SearchPrecoPage />} />
        <Route
          path={PUBLIC_ROUTES.accessibility}
          element={<CmsPage slug="accessibility" />}
        />
        <Route
          path={PUBLIC_ROUTES.legalMentions}
          element={<CmsPage slug="legal-mention" />}
        />
        <Route
          path={PUBLIC_ROUTES.privacyPolicy}
          element={<CmsPage slug="privacy-policy" />}
        />
      </Routes>
    </PublicLayout>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);

reportWebVitals();
