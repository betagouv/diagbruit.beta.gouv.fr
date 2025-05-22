import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { useSearchParams } from "react-router-dom";
import { tss } from "tss-react/dsfr";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticEvaluation from "./DiagnosticEvaluation";
import DiagnosticHero from "./DiagnosticHero";
import DiagnosticLegalInfos from "./DiagnosticLegalInfos";
import DiagnosticRecommendations from "./DiagnosticRecommendations";
import { useEffect } from "react";
import { trackMatomoEvent } from "../../utils/matomo";

type DiagnosticProps = {
  diagnosticItem: DiagnosticItem;
  isLoading: boolean;
};

const Diagnostic = ({ diagnosticItem }: DiagnosticProps) => {
  const { cx, classes } = useStyles();
  const [searchParams] = useSearchParams();
  const devMode = searchParams.get("dev") === "true";

  useEffect(() => {
    trackMatomoEvent(
      "Action",
      "Generate Diagnostic",
      `${diagnosticItem.parcelle.code_insee}-${diagnosticItem.parcelle.section}-${diagnosticItem.parcelle.numero}`
    );
  }, [diagnosticItem]);

  return (
    <div>
      <h2>Votre diagnostic diagBruit</h2>
      <div className={cx(classes.container)}>
        <DiagnosticHero diagnosticItem={diagnosticItem} />
        <DiagnosticLegalInfos diagnosticItem={diagnosticItem} />
        <DiagnosticRecommendations diagnosticItem={diagnosticItem} />
        <DiagnosticEvaluation diagnosticItem={diagnosticItem} />
        {devMode && (
          <Accordion label="Voir le retour de l'API">
            <pre>{JSON.stringify(diagnosticItem, null, 2)}</pre>
          </Accordion>
        )}
      </div>
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("6v"),
  },
}));

export default Diagnostic;
