import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import type { DiagnosticItem } from "../../../utils/types";

type RegulationIsolationProps = {
  diagnosticItem: DiagnosticItem;
};

const RegulationIsolation = ({ diagnosticItem }: RegulationIsolationProps) => {
  const { cx, classes } = useStyles();
  const { diagnostic } = diagnosticItem;
  const hasIsolation =
    diagnostic.isolation_max && diagnostic.isolation_max > 30;

  const hasPeb = diagnostic.air_intersections.length > 0;
  const hasCls = diagnostic.soundclassification_intersections.length > 0;
  const exposureText =
    hasPeb && hasCls
      ? "Vous êtes soumis au bruit aérien et au classement sonore"
      : hasPeb
        ? "Vous êtes soumis au bruit aérien"
        : "Vous êtes soumis au classement sonore";

  return (
    <>
      {hasIsolation ? (
        diagnostic.isolation_min !== diagnostic.isolation_max ? (
          <p className={fr.cx("fr-text--lg", "fr-mb-2v")}>
            {exposureText}, vous avez une obligation d'isolation réglementaire
            entre{" "}
            <strong>
              {diagnostic.isolation_min} et {diagnostic.isolation_max} dB
            </strong>{" "}
            selon la position du bati.
          </p>
        ) : (
          <p className={fr.cx("fr-text--lg", "fr-mb-2v")}>
            {exposureText}, vous avez une obligation d'isolation réglementaire
            de <strong>{diagnostic.isolation_max} dB</strong>.
          </p>
        )
      ) : (
        <p className={fr.cx("fr-text--lg", "fr-mb-2v")}>
          Votre parcelle n'est pas soumise à une isolation réglementaire.
          L'isolation acoustique minimale de <strong>30 dB</strong> est
          obligatoire selon la réglementation en vigueur.
        </p>
      )}
      <p
        className={cx(classes.fakeLink, fr.cx("fr-mb-0"))}
        onClick={() => {
          (
            document.querySelector('[id^="tabpanel-"][id$="-1"]') as HTMLElement
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
            document.querySelector('[id^="tabpanel-"][id$="-2"]') as HTMLElement
          )?.click();
        }}
      >
        Voir la répartition sonore sur la parcelle{" "}
        <i className={fr.cx("ri-arrow-right-line")} />
      </p>
    </>
  );
};

const useStyles = tss.create(() => ({
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

export default RegulationIsolation;
