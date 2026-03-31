import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tss } from "tss-react/dsfr";
import { trackMatomoEvent } from "../../utils/matomo";
import type { DiagnosticItem } from "../../utils/types";
import DiagnosticEvaluation from "./DiagnosticEvaluation";
import DiagnosticHero from "./DiagnosticHero";
import DiagnosticLegalInfos from "./DiagnosticLegalInfos";
import DiagnosticLocalNoiseSources from "./DiagnosticLocalNoiseSources";
import DiagnosticReceiveByMail from "./DiagnosticReceiveByMail";
import DiagnosticRecommendations from "./DiagnosticRecommendations";
import DiagnosticRegulation from "./DiagnosticRegulation";
import DiagnosticScoreOnScale from "./DiagnosticScoreOnScale";
import DiagnosticSectionTitle from "./DiagnosticSectionTitle";
import CardsDisplay from "./CardsDisplay";

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

  const [searchParams] = useSearchParams();

  const [copied, setCopied] = useState(false);
  const [activeTabId, setActiveTabId] = useState(searchParams.get("tab") || "evaluation");

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

  const replaceSearchParams = (tabId: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tabId);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  };

  const diagnosticTabs = [
    {
      tabId: "evaluation",
      label: "Résumé du diagnostic",
      isDefault: activeTabId === "evaluation",
      content: (
        <>
          <DiagnosticSectionTitle
            title={`1. Risques sonores sur la parcelle ${diagnosticItem.parcelle.numero}`}
            image={{
              src: "/images/connection-lost.svg",
              width: 56,
              height: 48,
            }}
          />
          <DiagnosticSectionTitle
            title={`Risque sonore`}
            isSecondTitle
            hint="Basé sur les cartes de bruit des transports routiers, ferroviaires et aériens"
          />
          {!diagnosticItem.diagnostic.flags.hasNoisemapWarning && (
            <DiagnosticScoreOnScale
              score={diagnosticItem.diagnostic.score}
              db={diagnosticItem.diagnostic.max_db_lden}
              light
            />
          )}
          <DiagnosticHero diagnosticItem={diagnosticItem} />
          <DiagnosticSectionTitle title={`Réglementation`} isSecondTitle />
          <DiagnosticRegulation diagnosticItem={diagnosticItem} />
          <DiagnosticSectionTitle
            title={`Autres sources de bruit à proximité`}
            isSecondTitle
            hint="Terrasses / bars , écoles, industries, ralentisseurs, marchés, carrossiers et équipements sportifs"
          />
          <DiagnosticLocalNoiseSources diagnosticItem={diagnosticItem} />
        </>
      ),
    },
    {
      tabId: "legal",
      label: "Isolation réglementaires",
      isDefault: activeTabId === "legal",
      content: (
        <>
          <DiagnosticSectionTitle
            title="2. Isolation réglementaires"
            image={{
              src: "/images/document.svg",
              width: 44,
              height: 60,
            }}
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
            title="3. Position du bâti"
            image={{
              src: "/images/innovation.svg",
              width: 55,
              height: 60,
            }}
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
      label: "Recommendations",
      isDefault: activeTabId === "recommendations",
      content: (
        <>
          <CardsDisplay />
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
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-8")}>
          <h2>Votre diagnostic diagBruit</h2>
        </div>
        <div className={cx(fr.cx("fr-col-4"), classes.buttonSection)}>
          <Button
            priority="secondary"
            iconId="ri-mail-line"
            linkProps={{
              href: `mailto:${process.env.REACT_APP_CONTACT_EMAIL}`,
              onClick: handleContactClick,
            }}
          >
            Contacter l'équipe diagBruit
          </Button>
        </div>
      </div>
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
            <div className={fr.cx("fr-col-3")}>
              <nav>
                <ul className={cx(classes.selectorList)}>
                  {diagnosticTabs.map((tab) => (
                    <li
                      key={tab.tabId}
                      className={cx(classes.selectorItem, tab.tabId === activeTabId && classes.selectorItemActive)}
                      onClick={() => {
                        setActiveTabId(tab.tabId);
                        replaceSearchParams(tab.tabId);
                        trackMatomoEvent("Action", "Tab Change", `Diagnostic Tab - ${tab.tabId}`);
                      }}
                    >
                      {tab.label}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <div className={fr.cx("fr-col-9")}>
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
          <DiagnosticReceiveByMail
            parcelNumber={`${diagnosticItem.parcelle.code_insee}-${diagnosticItem.parcelle.section}-${diagnosticItem.parcelle.numero}`}
          />
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
    minHeight: "calc(100vh - 200px)",
    marginTop: fr.spacing("2v"),
    ".fr-tabs__panel": {
      padding: `${fr.spacing("6v")} ${fr.spacing("8v")} ${fr.spacing(
        "8v",
      )} ${fr.spacing("8v")}`,
    },
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
  selectorList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("1v"),
    borderRight: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
  },
  selectorItem: {
    padding: `${fr.spacing("2v")} ${fr.spacing("4v")}`,
    cursor: "pointer",
    borderLeft: `3px solid transparent`,
    fontWeight: 700,
    color: fr.colors.decisions.text.default.grey.default,
    "&:hover": {
      borderLeftColor: fr.colors.decisions.border.default.blueFrance.default,
      color: fr.colors.decisions.text.active.blueFrance.default,
    },
  },
  selectorItemActive: {
    borderLeftColor: fr.colors.decisions.border.default.blueFrance.default,
    color: fr.colors.decisions.text.active.blueFrance.default,
  },
}));

export default Diagnostic;
