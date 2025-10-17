import React from "react";
import DiagnosticSectionTitle from "./DiagnosticSectionTitle";
import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { tss } from "tss-react/dsfr";
import DiagnosticIsolationRange from "./DiagnosticIsolationRange";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticVerificationNotice from "./DiagnosticVerificationNotice";
import Notice from "@codegouvfr/react-dsfr/Notice";

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
              une{" "}
              <strong>
                fourchette d'isolation au minimum entre xdb et ydb
              </strong>
              , vous pouvez suggérer au porteur de projet de prévoir une
              isolation située dans cette fourchette.
            </li>
          </ul>
        </>
      );
    }

    return (
      <>
        Vérifiez que le porteur de projet prévoit une{" "}
        <strong>
          isolation conforme à la réglementation{" "}
          {hasAnIsolationRange && "située dans cette fourchette"}
        </strong>
        .
      </>
    );
  };

  const getIsolationText = () => {
    if (!hasAnIsolationRange && isolation_min === 30) {
      return (
        <>
          Selon les exigences réglementaires, l'isolation à prévoir est de{" "}
          <strong>30dB</strong>
        </>
      );
    }

    if (!hasAnIsolationRange) {
      return (
        <>
          Selon les exigences réglementaires, diagBruit préconise une isolation
          de <strong>{isolation_min}dB</strong>
        </>
      );
    }
    return (
      <>
        Selon les exigences réglementaires, diagBruit préconise une isolation
        comprise entre{" "}
        <strong>
          {isolation_min}dB et {isolation_max}dB
        </strong>
      </>
    );
  };

  return (
    <div className={fr.cx("fr-mt-10v")}>
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
        <Badge noIcon severity="info">
          RESPECTER LA RÉGLEMENTATION
        </Badge>
        <Badge noIcon severity="new">
          OPTIMISER LE PROJET
        </Badge>
      </div>
      <p className={fr.cx("fr-mt-4v", "fr-mb-0")}>
        Une{" "}
        <strong>
          isolation du bâtiment adaptée au niveau de risque de bruit
        </strong>{" "}
        permet de <strong>limiter l’impact négatif</strong> des bruits
        extérieurs (trafic, voisinage, activités industrielles) et intérieurs
        (chocs, voix, équipements).
      </p>
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
      <p className={fr.cx("fr-mt-4v", "fr-mb-2v")}>{getIsolationText()}.</p>
      <div className={fr.cx("fr-mt-4v")}>
        <DiagnosticIsolationRange
          isolation_min={isolation_min}
          isolation_max={isolation_max}
        />
      </div>
      <div className={fr.cx("fr-mt-8v")}>
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
}));
