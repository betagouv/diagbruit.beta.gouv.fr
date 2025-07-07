import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./index.css";
import Home from "./pages/home";
import Diagnostic from "./pages/diagnostic";
import Changelogs from "./pages/changelogs";
import Stats from "./pages/stats";
import reportWebVitals from "./reportWebVitals";
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import PublicLayout from "./layouts/PublicLayout";
import ScrollToTop from "./components/utils/ScrollToTop";
import { useMatomo } from "./hooks/useMatomo";

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
      </Routes>
    </PublicLayout>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);

reportWebVitals();
