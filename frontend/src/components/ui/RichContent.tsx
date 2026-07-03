import { useEffect, useMemo, useRef, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

function normalizeTableHtml(tableEl: HTMLTableElement): string {
  const table = tableEl.cloneNode(true) as HTMLTableElement;

  if (!table.querySelector("thead")) {
    const body = table.querySelector("tbody") ?? table;
    const rows = Array.from(body.querySelectorAll(":scope > tr"));
    const headerRows: HTMLTableRowElement[] = [];
    for (const row of rows) {
      const cells = Array.from(row.children);
      const allTh = cells.length > 0 && cells.every((c) => c.tagName === "TH");
      if (allTh) headerRows.push(row as HTMLTableRowElement);
      else break;
    }
    if (headerRows.length > 0) {
      const thead = document.createElement("thead");
      headerRows.forEach((row) => thead.appendChild(row));
      table.insertBefore(thead, table.firstChild);
    }
  }

  return table.outerHTML;
}

interface RichContentProps {
  html: string;
  className?: string;
}

export const RichContent = ({ html, className }: RichContentProps) => {
  const { cx, classes } = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomedSrc, setZoomedSrc] = useState<string | null>(null);
  const [zoomedAlt, setZoomedAlt] = useState<string>("");

  const segments = useMemo(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const nodes = Array.from(doc.body.childNodes);

    const result: Array<
      { type: "html"; content: string } | { type: "table"; html: string }
    > = [];

    let htmlBuffer = "";

    for (const node of nodes) {
      const el = node as Element;
      const isCKTable =
        node.nodeType === Node.ELEMENT_NODE &&
        (el.tagName === "TABLE" ||
          (el.tagName === "FIGURE" && el.classList.contains("table")));

      if (isCKTable) {
        if (htmlBuffer) {
          result.push({ type: "html", content: htmlBuffer });
          htmlBuffer = "";
        }
        const tableEl =
          el.tagName === "TABLE"
            ? (el as HTMLTableElement)
            : (el.querySelector("table") as HTMLTableElement);
        if (tableEl) {
          result.push({ type: "table", html: normalizeTableHtml(tableEl) });
        }
      } else {
        const div = document.createElement("div");
        div.appendChild(node.cloneNode(true));
        htmlBuffer += div.innerHTML;
      }
    }

    if (htmlBuffer) {
      result.push({ type: "html", content: htmlBuffer });
    }

    return result;
  }, [html]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "IMG") {
        const img = target as HTMLImageElement;
        setZoomedSrc(img.currentSrc || img.src);
        setZoomedAlt(img.alt || "");
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [html]);

  useEffect(() => {
    if (!zoomedSrc) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomedSrc(null);
    };
    document.addEventListener("keydown", handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomedSrc]);

  return (
    <>
      <div ref={containerRef} className={cx(classes.container)}>
        {segments.map((segment, i) => {
          if (segment.type === "html") {
            return (
              <div
                key={i}
                className={className}
                dangerouslySetInnerHTML={{ __html: segment.content }}
              />
            );
          }
          return (
            <div
              key={i}
              className={cx(classes.table)}
              dangerouslySetInnerHTML={{ __html: segment.html }}
            />
          );
        })}
      </div>

      {zoomedSrc && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image agrandie"
          onClick={() => setZoomedSrc(null)}
          className={cx(classes.zoomedImageOverlay)}
        >
          <img
            src={zoomedSrc}
            alt={zoomedAlt}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              boxShadow: "0 0 40px rgba(0, 0, 0, 0.5)",
            }}
          />
        </div>
      )}
    </>
  );
};

const useStyles = tss.create(() => ({
  container: {
    "& img": {
      cursor: "zoom-in",
    },
  },
  table: {
    overflowX: "auto",
    marginBottom: fr.spacing("4v"),
    "& table": {
      width: "100%",
      borderCollapse: "collapse",
    },
    "& th, & td": {
      border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
      padding: fr.spacing("2v"),
      textAlign: "left",
      verticalAlign: "top",
    },
    "& thead th": {
      backgroundColor: fr.colors.decisions.background.contrast.grey.default,
      fontWeight: 700,
      verticalAlign: "middle",
    },
  },
  zoomedImageOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    background: "rgba(0, 0, 0, 0.85)",
    cursor: "zoom-out",
  }
}));
