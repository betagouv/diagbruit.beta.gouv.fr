import React from "react";
import DiagnosticSectionTitle from "./DiagnosticSectionTitle";
import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { tss } from "tss-react/dsfr";
import DiagnosticIsolationRange from "./DiagnosticIsolationRange";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticVerificationNotice from "./DiagnosticVerificationNotice";
import Notice from "@codegouvfr/react-dsfr/Notice";
import DiagnosticDecrees from "./DiagnosticDecrees";

type DiagnosticSummaryIsolationProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticSummaryIsolation: React.FC<DiagnosticSummaryIsolationProps> = ({
  diagnosticItem,
}) => {
  const { cx, classes } = useStyles();

  const {
    diagnostic: {
      isolation_min,
      isolation_max,
      flags: { hasClassificationWarning },
    },
  } = diagnosticItem;

  const hasAnIsolationRange = isolation_min !== isolation_max;

  const getVerificationText = () => {
    if (hasClassificationWarning) {
      return (
        <>
          diagBruit recommande :
          <ul className={fr.cx("fr-pl-6v")}>
            <li>
              <strong>
                de réaliser une étude acoustique afin de déterminer le niveau
                d’isolation à mettre en œuvre
              </strong>
            </li>
            <li>
              une <strong>isolation au minimum de {isolation_min}dB</strong>,
              vous pouvez suggérer au porteur de projet de prévoir cette
              isolation minimale
            </li>
          </ul>
        </>
      );
    }

    return (
      <div>
        <p className={fr.cx("fr-mb-3v")}>
          <strong>Comment vérifier la validité de l'isolation ?</strong>
        </p>
        <p className={fr.cx("fr-mb-0")}>
          <u>Si le pétitionnaire indique une valeur d’isolation :</u>
        </p>
        <ul className={cx(classes.checklist)}>
          <li>
            Vérifiez que cette valeur correspond à la fourchette conseillée par
            diagBruit.
          </li>
        </ul>
        <p className={fr.cx("fr-mb-0")}>
          <u>Si le pétitionnaire n’indique pas de valeur d’isolation :</u>
        </p>
        <ul className={cx(classes.checklist)}>
          <li>
            Le pétitionnaire fournit la description des murs extérieurs,
            précisant les matériaux utilisés (maçonnerie, isolation, doublage).
          </li>
          <li>
            Le pétitionnaire fournit la description des menuiseries extérieures,
            en indiquant le type de fenêtres et le vitrage utilisé.
          </li>
          <li>
            Le pétitionnaire fournit la description des portes extérieures, en
            précisant le type de porte et les matériaux utilisés.
          </li>
          <li>
            Le pétitionnaire fournit la description des dispositifs de
            ventilation et des conduits techniques, en précisant les
            aménagements prévus pour limiter la propagation du bruit (conduits,
            gaines, bouches).
          </li>
        </ul>
      </div>
    );
  };

  return (
    <div className={fr.cx("fr-mt-8v")}>
      <DiagnosticSectionTitle
        title="Niveau d'isolation visé"
        image={{
          src: "/images/isolation.svg",
          width: 55,
          height: 60,
        }}
        isSecondTitle
      />
      <div className={cx(classes.badgeContainer)}>
        <Badge noIcon severity="error">
          RESPECTER LA RÉGLEMENTATION
        </Badge>
      </div>
      {hasClassificationWarning && (
        <Notice
          description={
            <>
              Cette parcelle <strong>n’est pas soumise</strong> à une{" "}
              <strong>
                isolation réglementée, malgré le niveau de risque sonore élevé
              </strong>
              .
            </>
          }
          severity="warning"
          title=""
          className={cx(
            classes.classificationWarningNotice,
            fr.cx("fr-mt-4v", "fr-mb-6v")
          )}
        />
      )}
      <div className={fr.cx("fr-mt-4v")}>
        <DiagnosticIsolationRange
          isolation_min={isolation_min}
          isolation_max={isolation_max}
        />
      </div>
      <div className={fr.cx("fr-mt-4v")}>
        <DiagnosticDecrees />
      </div>
      <div className={fr.cx("fr-mt-6v")}>
        <DiagnosticVerificationNotice text={getVerificationText()} />
      </div>
    </div>
  );
};

export default DiagnosticSummaryIsolation;

const useStyles = tss.create(() => ({
  badgeContainer: {
    display: "flex",
    gap: fr.spacing("2v"),
  },
  classificationWarningNotice: {
    ".fr-notice__desc": {
      color: fr.colors.decisions.text.default.grey.default,
    },
  },
  checklist: {
    margin: `${fr.spacing("2v")} 0`,
    paddingLeft: fr.spacing("8v"),
  },
}));
