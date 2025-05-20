import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const useMatomo = () => {
  const location = useLocation();

  useEffect(() => {
    if (!window._paq) return;

    window._paq.push(["setCustomUrl", location.pathname + location.search]);
    window._paq.push(["setDocumentTitle", document.title]);
    window._paq.push(["trackPageView"]);
  }, [location]);
};
