import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./index.css";
import Home from "./pages/home";
import Diagnostic from "./pages/diagnostic";
import reportWebVitals from "./reportWebVitals";
import { startReactDsfr } from "@codegouvfr/react-dsfr/spa";
import PublicLayout from "./layouts/PublicLayout";
import ScrollToTop from "./components/utils/ScrollToTop";

startReactDsfr({ defaultColorScheme: "light" });

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <Router>
      <PublicLayout>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/diagnostic" element={<Diagnostic />} />
        </Routes>
      </PublicLayout>
    </Router>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
