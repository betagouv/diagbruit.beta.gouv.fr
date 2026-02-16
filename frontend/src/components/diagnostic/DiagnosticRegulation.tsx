import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import { tss } from "tss-react/dsfr";
import { getPebRegulationTextFromZone } from "../../utils/texts/regulation";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticDecreesBox from "./DiagnosticDecreesBox";
import DiagnosticRegulationBox from "./DiagnosticRegulationBox";

type DiagnosticRegulationProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticRegulation = ({
  diagnosticItem,
}: DiagnosticRegulationProps) => {
  const { cx, classes } = useStyles();

  const { diagnostic } = diagnosticItem;

  const hasPebRegulation = diagnostic.air_intersections.length > 0;

  const hasClsRegulation =
    diagnostic.soundclassification_intersections.length > 0;

  const hasPluRegulation = diagnostic.noisezone_intersections.length > 0;

  const hasIsolationRegulation =
    diagnostic.isolation_max && diagnostic.isolation_max > 30;

  const renderAttentionIcon = (kind: "peb" | "cls" | "plu" | "isolation") => {
    switch (kind) {
      case "peb":
        if (hasPebRegulation) return <i className={fr.cx("ri-alert-fill")} />;
        return <i className={fr.cx("ri-checkbox-circle-fill")} />;
      case "cls":
        if (hasClsRegulation) return <i className={fr.cx("ri-alert-fill")} />;
        return <i className={fr.cx("ri-checkbox-circle-fill")} />;
      case "plu":
        if (hasPluRegulation) return <i className={fr.cx("ri-alert-fill")} />;
        return <i className={fr.cx("ri-checkbox-circle-fill")} />;
      case "isolation":
        if (hasIsolationRegulation)
          return <i className={fr.cx("ri-alert-fill")} />;
        return <i className={fr.cx("ri-checkbox-circle-fill")} />;
    }

    return <i className={fr.cx("ri-checkbox-circle-fill")} />;
  };

  return (
    <div className={cx(fr.cx("fr-accordions-group"), classes.container)}>
      <Accordion
        label={
          <>
            <i className={fr.cx("ri-plane-line", "fr-mr-1v")} /> Nationale
            Aérien (PEB)
            {renderAttentionIcon("peb")}
          </>
        }
      >
        {hasPebRegulation ? (
          <div className={fr.cx("fr-mb-4v")}>
            <DiagnosticRegulationBox
              label={`Zone ${diagnostic.air_intersections[0].zone}`}
              content={
                getPebRegulationTextFromZone(
                  diagnostic.air_intersections[0].zone,
                ) || ""
              }
              source="PEB"
            />
          </div>
        ) : (
          <p className={fr.cx("fr-text--lg", "fr-mb-4v")}>
            Votre parcelle n’est pas impactée par la réglementation Aérienne.
          </p>
        )}
        <DiagnosticDecreesBox
          links={[
            {
              label: "Test",
              url: "https://google.com/",
            },
            {
              label: "Test2",
              url: "https://google1.com/",
            },
          ]}
        />
      </Accordion>
      <Accordion
        label={
          <>
            <i className={fr.cx("ri-car-line", "fr-mr-1v")} /> Nationale
            Terrestre (Classement sonore)
            {renderAttentionIcon("cls")}
          </>
        }
      >
        {hasClsRegulation ? (
          <div className={fr.cx("fr-mb-4v")}>
            <DiagnosticRegulationBox
              label={`Parcelle soumis au classement sonore`}
              content={
                <>
                  <p className={fr.cx("fr-mb-4v")}>
                    Vous avez une obligation réglementaire d’isoler votre
                    bâtiment.
                  </p>
                  <p
                    className={cx(classes.fakeLink, fr.cx("fr-mb-0"))}
                    onClick={() => {
                      (
                        document.querySelector(
                          '[id^="tabpanel-"][id$="-1"]',
                        ) as HTMLElement
                      )?.click();
                    }}
                  >
                    Voir la valeur de l’isolation réglementaire{" "}
                    <i className={fr.cx("ri-arrow-right-line")} />
                  </p>
                </>
              }
            />
          </div>
        ) : (
          <p className={fr.cx("fr-text--lg", "fr-mb-4v")}>
            Votre parcelle n’est pas impactée par le classement sonore.
          </p>
        )}
        <DiagnosticDecreesBox
          links={[
            {
              label: "Test",
              url: "https://google.com/",
            },
            {
              label: "Test2",
              url: "https://google1.com/",
            },
          ]}
        />
      </Accordion>
      <Accordion
        label={
          <>
            <i className={fr.cx("ri-building-line", "fr-mr-1v")} /> Locales
            (PLU)
            {renderAttentionIcon("plu")}
          </>
        }
      >
        {hasPluRegulation ? (
          diagnostic.noisezone_intersections.map((noisezone, index) => (
            <div className={fr.cx("fr-mb-4v")}>
              <DiagnosticRegulationBox
                key={index}
                label={noisezone.label}
                content={noisezone.alert}
                source="PLU"
              />
            </div>
          ))
        ) : (
          <p className={fr.cx("fr-text--lg", "fr-mb-4v")}>
            Aucune spécificité locale inscrite au PLU.
          </p>
        )}
        <DiagnosticDecreesBox
          links={[
            {
              label: "Test",
              url: "https://google.com/",
            },
            {
              label: "Test2",
              url: "https://google1.com/",
            },
          ]}
        />
      </Accordion>
      <Accordion
        label={
          <>
            <i className={fr.cx("ri-voiceprint-line", "fr-mr-1v")} /> Isolation
            réglementaire
            {renderAttentionIcon("isolation")}
          </>
        }
      >
        {hasIsolationRegulation ? (
          diagnostic.isolation_min !== diagnostic.isolation_max ? (
            <p className={fr.cx("fr-text--lg", "fr-mb-2v")}>
              Vous êtes soumis au bruit aérien et au classement sonore, vous
              avez une obligation d’isolation réglementaire entre{" "}
              <strong>
                {diagnostic.isolation_min} et {diagnostic.isolation_max} dB
              </strong>{" "}
              selon la position du bati.
            </p>
          ) : (
            <p className={fr.cx("fr-text--lg", "fr-mb-2v")}>
              Vous êtes soumis au bruit aérien et au classement sonore, vous
              avez une obligation d’isolation réglementaire de{" "}
              <strong>{diagnostic.isolation_max} dB</strong>.
            </p>
          )
        ) : (
          <>
            <p className={fr.cx("fr-text--lg", "fr-mb-2v")}>
              Votre parcelle n’est pas soumise à une isolation réglementaire.
              L'isolation acoustique minimale de <strong>30 dB</strong> est
              obligatoire selon la réglementation en vigueur.
            </p>
          </>
        )}
        <p
          className={cx(classes.fakeLink, fr.cx("fr-mb-0"))}
          onClick={() => {
            (
              document.querySelector(
                '[id^="tabpanel-"][id$="-1"]',
              ) as HTMLElement
            )?.click();
          }}
        >
          Voir le détail du classement sonore{" "}
          <i className={fr.cx("ri-arrow-right-line")} />
        </p>
        <p
          className={cx(classes.fakeLink, fr.cx("fr-mb-0"))}
          onClick={() => {
            (
              document.querySelector(
                '[id^="tabpanel-"][id$="-2"]',
              ) as HTMLElement
            )?.click();
          }}
        >
          Voir la répartition sonore sur la parcelle{" "}
          <i className={fr.cx("ri-arrow-right-line")} />
        </p>
      </Accordion>
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    marginBottom: fr.spacing("8v"),
    ".ri-checkbox-circle-fill, .ri-alert-fill": {
      alignSelf: "flex-end",
      marginLeft: "auto",
      "&.ri-checkbox-circle-fill": {
        color: fr.colors.decisions.background.flat.success.default,
      },
      "&.ri-alert-fill": {
        color: fr.colors.decisions.background.flat.warning.default,
      },
    },
    ".fr-collapse--expanded": {
      padding: `${fr.spacing("4v")} ${fr.spacing("2v")}`,
    },
    ".fr-accordion__btn::after": {
      marginLeft: fr.spacing("2v"),
    },
  },
  fakeLink: {
    ...fr.typography[19].style,
    textDecoration: "underline",
    cursor: "pointer",
    color: fr.colors.decisions.background.flat.blueFrance.default,
    "i::before": {
      "--icon-size": fr.typography[19].style.fontSize,
    },
  },
}));

export default DiagnosticRegulation;
