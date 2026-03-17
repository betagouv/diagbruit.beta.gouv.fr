import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import type React from "react";
import { tss } from "tss-react/dsfr";
import type { DiagnosticItem } from "../../utils/types";
import DiagnosticPosition from "./DiagnosticPosition";
import DiagnosticSectionTitle from "./DiagnosticSectionTitle";
import DiagnosticVerificationNotice from "./DiagnosticVerificationNotice";

type DiagnosticSummaryPositionProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticSummaryPosition: React.FC<DiagnosticSummaryPositionProps> = ({
  diagnosticItem,
}) => {
  const { cx, classes } = useStyles();

  return (
    <div className={fr.cx("fr-mt-14v")}>
      <DiagnosticSectionTitle
        title="Position du bâti et orientation"
        image={{
          src: "/images/position.svg",
          width: 55,
          height: 60,
        }}
        isSecondTitle
      />
      <div className={cx(classes.badgeContainer)}>
        <Badge noIcon severity="new">
          OPTIMISER LE PROJET
        </Badge>
      </div>
      <p className={fr.cx("fr-mt-4v", "fr-mb-0")}>
        Au delà de la réglementation, diagBruit préconise une{" "}
        <strong>
          position de bâti idéale en fonction des risques sonores identifiés.
        </strong>
      </p>
      <div className={fr.cx("fr-mt-4v")}>
        <DiagnosticPosition diagnosticItem={diagnosticItem} />
      </div>
      <div className={fr.cx("fr-mt-8v")}>
        <DiagnosticVerificationNotice
          text={
            <div>
              <p className={fr.cx("fr-mb-3v")}>
                <strong>
                  Comment vérifier la pertinence de la position du bâti ?
                </strong>
              </p>
              <ul>
                <li>
                  Le pétitionnaire a positionné le bâti dans la zone préconisée
                  par diagBruit.
                </li>
                <li>
                  Le pétitionnaire a positionné les pièces à vivre à l’opposé
                  des zones les plus risquées de la parcelle.
                </li>
              </ul>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default DiagnosticSummaryPosition;

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
