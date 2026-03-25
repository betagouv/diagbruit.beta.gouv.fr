import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tss } from "tss-react/dsfr";
import { trackMatomoEvent } from "../../utils/matomo";
import type { DiagnosticItem } from "../../utils/types";
import DiagnosticDocumentation from "./DiagnosticDocumentation";
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

  const devMode = searchParams.get("dev") === "true";
  const tabId = searchParams.get("tab") || "evaluation";

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
      isDefault: tabId === "evaluation",
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
      isDefault: tabId === "legal",
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
      isDefault: tabId === "position",
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
      label: "Préconisations",
      isDefault: tabId === "recommendations",
      content: (
        <>
          <DiagnosticSectionTitle
            title="4. Préconisations"
            image={{
              src: "/images/document.svg",
              width: 55,
              height: 60,
            }}
          />
          <DiagnosticDocumentation diagnosticItem={diagnosticItem} />
        </>
      ),
    },
    {
      tabId: "recommendations",
      label: "Médiathèque de préconisations",
      isDefault: tabId === "recommendations",
      content: (
        <div className={"fr-container"}>
          <CardsDisplay />

        </div>
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
          <Tabs
            key={`${diagnosticItem.parcelle.code_insee}-${diagnosticItem.parcelle.section}-${diagnosticItem.parcelle.numero}`}
            tabs={diagnosticTabs}
            onTabChange={(tabItem) => {
              const tabId = (tabItem.tab as any)?.tabId as string; // bug in package typing, tabId exists but is not typed
              replaceSearchParams(tabId);
              trackMatomoEvent(
                "Action",
                "Tab Change",
                `Diagnostic Tab - ${tabId}`,
              );
            }}
          />
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
          <div className={fr.cx("fr-card", "fr-p-4v")}>
            <iframe
              data-tally-src="https://tally.so/embed/1A4kZL?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
              loading="lazy"
              width="100%"
              height={275}
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              title="Votre avis sur diagBruit"
            />
          </div>
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
}));

export default Diagnostic;
