import { useEffect, useState } from "react";
import {
  DiagnosticItem,
  DiagnosticResponseOk,
  DiagnosticResponseError,
} from "../../utils/types";

function getParcelleId(parcelle: any) {
  return `${parcelle.code_insee}-${parcelle.section}-${parcelle.numero}`;
}

export function useDiagnostics(parcelle: any, parcelleSiblings: any[]) {
  const [archives, setArchives] = useState<DiagnosticItem[]>([]);
  const [response, setResponse] = useState<DiagnosticResponseOk>();
  const [error, setError] = useState<DiagnosticResponseError>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!parcelle || !parcelle.properties) return;

    const {
      commune: code_insee,
      section: tmpSection,
      numero: tmpNumero,
    } = parcelle.properties;

    const numero = tmpNumero.toString().padStart(4, "0");
    const section = tmpSection.toString().padStart(2, "0");

    const mainParcelle = {
      parcelle: { code_insee, section, numero },
      geometry: parcelle.geometry.coordinates,
      populate: {
        zones: true,
        isolation: true,
      },
    };

    const siblings = parcelleSiblings.map((sibling) => {
      const { commune, section, numero } = sibling.properties;
      return {
        parcelle: {
          code_insee: commune,
          section: section.toString().padStart(2, "0"),
          numero: numero.toString().padStart(4, "0"),
        },
        geometry: sibling.geometry.coordinates,
        populate: {
          zone: false,
          isolation: false,
        },
      };
    });

    const archivedIds = new Set(archives.map((a) => getParcelleId(a.parcelle)));

    const siblingsToRequest = siblings.filter(
      (item) => !archivedIds.has(getParcelleId(item.parcelle)),
    );

    const itemsToRequest = [mainParcelle, ...siblingsToRequest];

    setIsLoading(true);
    setError(undefined);

    fetch(`${process.env.REACT_APP_API_URL}/diag/generate/from-geometries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: itemsToRequest }),
    })
      .then((res) => {
        if (!res.ok) {
          res.json().then((apiResponse: any) => {
            setError({
              code: res.status,
              message: apiResponse.detail,
            });
            console.error(
              "Erreur lors de la récupération du diagnostic :",
              apiResponse,
            );
          });
        } else {
          res.json().then((apiResponse: DiagnosticResponseOk) => {
            const newDiagnostics = apiResponse.diagnostics;
            const newDiagnosticsIds = new Set(
              newDiagnostics.map((item) => getParcelleId(item.parcelle)),
            );

            const updatedArchives = [
              ...archives.filter(
                (archive) =>
                  !newDiagnosticsIds.has(getParcelleId(archive.parcelle)),
              ),
              ...newDiagnostics,
            ];

            const diagnostics = [mainParcelle, ...siblings]
              .map((p) => {
                const id = getParcelleId(p.parcelle);
                return updatedArchives.find(
                  (a) => getParcelleId(a.parcelle) === id,
                );
              })
              .filter(Boolean) as DiagnosticItem[];

            setArchives(updatedArchives);
            setResponse({ diagnostics });
          });
        }
      })
      .catch((err) => {
        console.error("Network or fetch error:", err.message);
        setError({
          code: 500,
          message: err.message || "Network error occurred",
        });
      })
      .finally(() => {
        setIsLoading(false);
        document.getElementById("map")?.scrollIntoView({
          behavior: "smooth",
        });
      });
  }, [parcelle]);

  return { response, error, isLoading, archives };
}
