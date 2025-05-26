import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import Notice from "@codegouvfr/react-dsfr/Notice";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tss } from "tss-react/dsfr";
import { trackMatomoEvent } from "../../utils/matomo";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticEvaluation from "./DiagnosticEvaluation";
import DiagnosticHero from "./DiagnosticHero";
import DiagnosticLegalInfos from "./DiagnosticLegalInfos";
import DiagnosticRecommendations from "./DiagnosticRecommendations";

type DiagnosticProps = {
  diagnosticItem: DiagnosticItem;
  isLoading: boolean;
};

const Diagnostic = ({ diagnosticItem }: DiagnosticProps) => {
  const { cx, classes } = useStyles();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const devMode = searchParams.get("dev") === "true";

  useEffect(() => {
    trackMatomoEvent(
      "Action",
      "Generate Diagnostic",
      `${diagnosticItem.parcelle.code_insee}-${diagnosticItem.parcelle.section}-${diagnosticItem.parcelle.numero}`
    );
  }, [diagnosticItem]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000); // reset après 3s
    } catch (err) {
      console.error("Erreur lors de la copie de l'URL :", err);
    }
  };

  return (
    <div>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-8")}>
          <h2>Votre diagnostic diagBruit</h2>
        </div>
        <div className={cx(fr.cx("fr-col-4"), classes.buttonSection)}>
          <Button
            className={fr.cx("fr-btn--secondary")}
            iconId="ri-file-copy-line"
            onClick={handleCopyUrl}
          >
            Copier l'URL du diagnostic
          </Button>
        </div>
      </div>
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
        {copied && (
          <Notice
            severity="info"
            description="URL copiée dans le presse-papiers"
            title=""
            className={cx(classes.alertCopied)}
            onClose={function noRefCheck() {}}
            isClosable
          />
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
  alertCopied: {
    position: "fixed",
    bottom: fr.spacing("4v"),
    left: fr.spacing("4v"),
  },
  buttonSection: {
    textAlign: "right",
  },
}));

export default Diagnostic;
