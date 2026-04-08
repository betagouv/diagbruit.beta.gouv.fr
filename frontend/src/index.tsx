import React from "react";
import ReactDOM from "react-dom/client";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
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

startReactDsfr({ defaultColorScheme: "light" });

const App = () => {
  if (process.env.NODE_ENV === "production") {
    useMatomo();
  }

  return (
    <PublicLayout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/diagnostic" element={<Diagnostic />} />
        <Route path="/changelogs" element={<Changelogs />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/preco/:slug" element={<PrecoPage />} />
        <Route
          path="/accessibility"
          element={<CmsPage slug="accessibility" />}
        />
        <Route
          path="/legal-mentions"
          element={<CmsPage slug="legal-mention" />}
        />
        <Route
          path="/privacy-policy"
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
