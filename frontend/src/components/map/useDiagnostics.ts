import { useEffect, useState } from "react";
import { DiagnosticResponse } from "../../utils/types";

export function useDiagnostics(parcelle: any, parcelleSiblings: any[]) {
  const [response, setResponse] = useState<any>();
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

    const siblings = parcelleSiblings.map((sibling) => {
      const { commune, section, numero } = sibling.properties;
      return {
        parcelle: {
          code_insee: commune,
          section: section.toString().padStart(2, "0"),
          numero: numero.toString().padStart(4, "0"),
        },
        geometry: sibling.geometry.coordinates,
      };
    });

    setIsLoading(true);
    fetch(`${process.env.REACT_APP_API_URL}/diag/generate/from-geometries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [
          {
            parcelle: { code_insee, section, numero },
            geometry: parcelle.geometry.coordinates,
          },
          ...siblings,
        ],
      }),
    })
      .then((res) => res.json())
      .then(setResponse)
      .catch((err) => console.error("Erreur:", err))
      .finally(() => setIsLoading(false));
  }, [parcelle]);

  return { response: response as DiagnosticResponse, isLoading };
}
