import { useEffect, useRef, useState } from "react";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { tss } from "tss-react/dsfr";

interface ParsedTable {
  caption: string;
  headers: string[];
  data: string[][];
}

function parseTable(tableEl: HTMLTableElement): ParsedTable {
  const caption = tableEl.querySelector("caption")?.textContent?.trim() ?? "";

  const headerCells = Array.from(
    tableEl.querySelectorAll("thead tr th")
  );
  const headers = headerCells.map((th) => th.textContent?.trim() ?? "");

  let dataRows: HTMLTableRowElement[];
  if (headers.length === 0) {
    const allRows = Array.from(tableEl.querySelectorAll("tbody tr, tr"));
    const firstRow = allRows[0];
    if (firstRow) {
      Array.from(firstRow.querySelectorAll("th, td")).forEach((cell) =>
        headers.push(cell.textContent?.trim() ?? "")
      );
    }
    dataRows = allRows.slice(1) as HTMLTableRowElement[];
  } else {
    dataRows = Array.from(
      tableEl.querySelectorAll("tbody tr")
    ) as HTMLTableRowElement[];
  }

  const data = dataRows.map((row) =>
    Array.from(row.querySelectorAll("td, th")).map(
      (cell) => cell.textContent?.trim() ?? ""
    )
  );

  return { caption, headers, data };
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

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nodes = Array.from(doc.body.childNodes);

  const segments: Array<
    { type: "html"; content: string } | { type: "table"; table: ParsedTable }
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
        segments.push({ type: "html", content: htmlBuffer });
        htmlBuffer = "";
      }
      const tableEl =
        el.tagName === "TABLE"
          ? (el as HTMLTableElement)
          : (el.querySelector("table") as HTMLTableElement);
      if (tableEl) {
        segments.push({ type: "table", table: parseTable(tableEl) });
      }
    } else {
      const div = document.createElement("div");
      div.appendChild(node.cloneNode(true));
      htmlBuffer += div.innerHTML;
    }
  }

  if (htmlBuffer) {
    segments.push({ type: "html", content: htmlBuffer });
  }

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
    return () => document.removeEventListener("keydown", handleKey);
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
          const { headers, data } = segment.table;
          return (
            <Table
              key={i}
              headers={headers}
              data={data}
              bordered
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