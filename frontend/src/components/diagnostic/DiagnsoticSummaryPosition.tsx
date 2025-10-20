import React from "react";
import DiagnosticSectionTitle from "./DiagnosticSectionTitle";
import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { tss } from "tss-react/dsfr";
import DiagnosticIsolationRange from "./DiagnosticIsolationRange";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticVerificationNotice from "./DiagnosticVerificationNotice";
import Notice from "@codegouvfr/react-dsfr/Notice";
import DiagnosticPosition from "./DiagnosticPosition";

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
            "Vous pouvez comparer les plans du porteur de projet avec la préconisation ci-dessus."
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
