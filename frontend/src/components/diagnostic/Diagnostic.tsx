import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Button from "@codegouvfr/react-dsfr/Button";
import Notice from "@codegouvfr/react-dsfr/Notice";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tss } from "tss-react/dsfr";
import { trackMatomoEvent } from "../../utils/matomo";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticEvaluation from "./DiagnosticEvaluation";
import DiagnosticHero from "./DiagnosticHero";
import DiagnosticLegalInfos from "./DiagnosticLegalInfos";
import DiagnosticRecommendations from "./DiagnosticRecommendations";
import DiagnosticSectionTitle from "./DiagnosticSectionTitle";

type DiagnosticProps = {
  diagnosticItem: DiagnosticItem;
  isLoading: boolean;
};

const Diagnostic = ({ diagnosticItem }: DiagnosticProps) => {
  const { cx, classes } = useStyles();
  const [searchParams] = useSearchParams();

  const [copied, setCopied] = useState(false);

  const devMode = searchParams.get("dev") === "true";

  const diagnosticTabs = [
    {
      tabId: "evaluation",
      label: "Évaluation du risque",
      isDefault: true,
      content: (
        <>
          <DiagnosticSectionTitle
            title="1. Évaluation du risque selon diagBruit"
            image={{
              src: "/images/connection-lost.svg",
              width: 80,
              height: 80,
            }}
          />
          <DiagnosticHero diagnosticItem={diagnosticItem} />
          <DiagnosticEvaluation diagnosticItem={diagnosticItem} />
        </>
      ),
    },
    {
      tabId: "legal",
      label: "Informations réglementaires",
      content: (
        <>
          <DiagnosticSectionTitle
            title="2. Informations réglementaires"
            image={{
              src: "/images/document.svg",
              width: 80,
              height: 80,
            }}
          />
          <DiagnosticLegalInfos diagnosticItem={diagnosticItem} />
        </>
      ),
    },
    {
      tabId: "recommendations",
      label: "Préconisations",
      content: (
        <>
          <DiagnosticSectionTitle
            title="2. Préconisations"
            image={{
              src: "/images/innovation.svg",
              width: 80,
              height: 80,
            }}
          />
          <DiagnosticRecommendations diagnosticItem={diagnosticItem} />
        </>
      ),
    },
  ];

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
        <Tabs
          key={`${diagnosticItem.parcelle.code_insee}-${diagnosticItem.parcelle.section}-${diagnosticItem.parcelle.numero}`}
          tabs={diagnosticTabs}
          onTabChange={(tabId) => {
            trackMatomoEvent(
              "Action",
              "Tab Change",
              `Diagnostic Tab - ${tabId}`
            );
          }}
        />
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
    minHeight: "calc(100vh - 200px)",
    ".fr-tabs__panel": {
      padding: `${fr.spacing("4v")} ${fr.spacing("8v")} ${fr.spacing(
        "8v"
      )} ${fr.spacing("8v")}`,
    },
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
