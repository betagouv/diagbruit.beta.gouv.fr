import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { SideMenu } from "@codegouvfr/react-dsfr/SideMenu";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tss } from "tss-react/dsfr";
import { trackMatomoEvent } from "../../utils/matomo";
import type { DiagnosticItem } from "../../utils/types";
import DiagnosticEvaluation from "./DiagnosticEvaluation";
import DiagnosticLegalInfos from "./DiagnosticLegalInfos";
import DiagnosticReceiveByMail from "./DiagnosticReceiveByMail";
import DiagnosticRecommendations from "./DiagnosticRecommendations";
import DiagnosticRegulation from "./DiagnosticRegulation";
import DiagnosticSectionTitle from "./DiagnosticSectionTitle";
import DiagnosticCardsDisplay from "./DiagnosticDocumentation";
import DiagnosticLocalNoiseSources from "./DiagnosticLocalNoiseSources";


type DiagnosticProps = {
  diagnosticItem: DiagnosticItem;
  isLoading: boolean;
};

const Diagnostic = ({ diagnosticItem }: DiagnosticProps) => {
  const { cx, classes } = useStyles();

  const {
    diagnostic: {
      flags: { isMultiExposedSources },
      score,
    },
  } = diagnosticItem;

  const [searchParams, setSearchParams] = useSearchParams();

  const [copied, setCopied] = useState(false);
  const activeTabId = searchParams.get("tab") || "reglementations";

  const devMode = searchParams.get("dev") === "true";

  const handleCopyUrl = async (title?: string) => {
    try {
      trackMatomoEvent(
        "Action",
        title ?? "Copy Diagnostic",
        `${diagnosticItem.parcelle.code_insee}-${diagnosticItem.parcelle.section}-${diagnosticItem.parcelle.numero}`,
      );
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Erreur lors de la copie de l'URL :", err);
    }
  };

  const handleContactClick = () => {
    trackMatomoEvent(
      "Diagnostic",
      "Contact",
      `${diagnosticItem.parcelle.code_insee}-${diagnosticItem.parcelle.section}-${diagnosticItem.parcelle.numero}`,
    );
  };


  const diagnosticTabs = [
    {
      tabId: "reglementations",
      label: "Réglementations",
      isDefault: activeTabId === "reglementations",
      content: (
        <>
          <DiagnosticSectionTitle
            title="Réglementations"
          />
          <div className={fr.cx("fr-mb-8v")}>
            <DiagnosticReceiveByMail
              parcelNumber={`${diagnosticItem.parcelle.code_insee}-${diagnosticItem.parcelle.section}-${diagnosticItem.parcelle.numero}`}
            />
          </div>
          <DiagnosticRegulation diagnosticItem={diagnosticItem} />
          <h4>Autres sources de bruit à proximité</h4>
          <DiagnosticLocalNoiseSources diagnosticItem={diagnosticItem} />
        </>
      ),
    },
    {
      tabId: "legal",
      label: "Isolation réglementaire",
      isDefault: activeTabId === "legal",
      content: (
        <>
          <DiagnosticSectionTitle
            title="Isolation réglementaire"
          />
          <DiagnosticLegalInfos diagnosticItem={diagnosticItem} />
        </>
      ),
    },
    {
      tabId: "position",
      label: "Position du bâti",
      isDefault: activeTabId === "position",
      content: (
        <>
          <DiagnosticSectionTitle
            title="Position du bâti"

          />
          <DiagnosticRecommendations diagnosticItem={diagnosticItem} />
          {!diagnosticItem.diagnostic.flags.hasNoisemapWarning && (
            <DiagnosticEvaluation diagnosticItem={diagnosticItem} />
          )}
        </>
      ),
    },
    {
      tabId: "recommendations",
      label: "Recommandations",
      isDefault: activeTabId === "recommendations",
      content: (
        <>
          <DiagnosticCardsDisplay />
        </>
      ),
    },
  ];

  useEffect(() => {
    trackMatomoEvent(
      "Action",
      "Generate Diagnostic",
      `${diagnosticItem.parcelle.code_insee}-${diagnosticItem.parcelle.section}-${diagnosticItem.parcelle.numero}`,
    );
  }, [diagnosticItem]);

  useEffect(() => {
    const w = "https://tally.so/widgets/embed.js";
    const loadEmbeds = () => {
      if (typeof (window as any).Tally !== "undefined") {
        (window as any).Tally.loadEmbeds();
      } else {
        document
          .querySelectorAll("iframe[data-tally-src]:not([src])")
          .forEach((e) => {
            (e as HTMLIFrameElement).src =
              (e as HTMLIFrameElement).dataset.tallySrc || "";
          });
      }
    };

    if (typeof (window as any).Tally !== "undefined") {
      loadEmbeds();
    } else if (!document.querySelector(`script[src="${w}"]`)) {
      const s = document.createElement("script");
      s.src = w;
      s.onload = loadEmbeds;
      s.onerror = loadEmbeds;
      document.body.appendChild(s);
    } else {
      loadEmbeds();
    }
  }, []);

  return (
    <div id="diagnostic-section">
      {diagnosticItem.diagnostic.score === 0 ? (
        <div className={cx(classes.container)}>
          <h3 className={cx(fr.cx("fr-mb-0", "fr-mt-4v"), classes.subtitle)}>
            Cette parcelle n’est impactée ni par les cartes de bruit
            stratégique, ni par le plan d’exposition au bruit.{" "}
          </h3>
          <Alert
            description="Attention, cela ne signifie pas que le risque sonore est inexistant car cette parcelle peut être impactée par des bruit d’activité, d’éolienne, d’écoles, etc."
            onClose={function noRefCheck() { }}
            severity="info"
            title=""
          />
        </div>
      ) : (
        <div className={cx(classes.container)}>
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
              <SideMenu
                burgerMenuButtonText="Navigation"
                items={diagnosticTabs.map((tab) => ({
                  text: tab.label,
                  isActive: tab.tabId === activeTabId,
                  linkProps: {
                    href: "#",
                    onClick: (e: React.MouseEvent) => {
                      e.preventDefault();
                      setSearchParams(prev => new URLSearchParams({ ...Object.fromEntries(prev), tab: tab.tabId }));
                      trackMatomoEvent("Action", "Tab Change", `Diagnostic Tab - ${tab.tabId}`);
                    },
                  },
                }))}
              />
            </div>
            <div className={fr.cx("fr-col-12", "fr-col-md-9")}>
              {diagnosticTabs.find((tab) => tab.tabId === activeTabId)?.content}
            </div>
          </div>
          {devMode && (
            <Accordion label="Voir le retour de l'API" titleAs="h2">
              <pre>
                {JSON.stringify(
                  diagnosticItem,
                  (k, v) => (k.startsWith("geometry") ? undefined : v),
                  2,
                )}
              </pre>
            </Accordion>
          )}

        </div>
      )}
      {copied && (
        <Alert
          severity="success"
          description="URL du diagnostic copiée dans le presse-papiers"
          title="URL copiée"
          className={cx(classes.alertCopied)}
          onClose={() => setCopied(false)}
          closable
        />
      )}
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("6v"),
    marginTop: fr.spacing("2v"),
  },
  subtitle: {
    ...fr.typography[1].style,
  },
  alertCopied: {
    position: "fixed",
    bottom: fr.spacing("4v"),
    left: fr.spacing("4v"),
    backgroundColor: fr.colors.decisions.background.default.grey.default,
  },
  buttonSection: {
    textAlign: "right",
    "& > *:not(:last-child)": {
      marginRight: fr.spacing("2v"),
    },
  },
}));

export default Diagnostic;
