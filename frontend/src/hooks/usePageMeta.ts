import { useEffect } from "react";

const APP_NAME = "diagBruit";

export const usePageMeta = (title: string, description?: string) => {
  useEffect(() => {
    document.title = `${title} - ${APP_NAME}`;

    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }

    return () => {
      document.title = APP_NAME;
    };
  }, [title, description]);
};