import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import React from "react";
import { tss } from "tss-react/dsfr";
import DiagnosticSectionTitle from "./DiagnosticSectionTitle";
import DiagnosticVerificationNotice from "./DiagnosticVerificationNotice";

const DiagnosticSummarySourceAction: React.FC = () => {
  const { cx, classes } = useStyles();

  return (
    <div className={fr.cx("fr-mt-14v")}>
      <DiagnosticSectionTitle
        title="Étude de faisabilité d'action à la source"
        image={{
          src: "/images/search-2.svg",
          width: 55,
          height: 60,
        }}
        isSecondTitle
      />
      <div className={cx(classes.badgeContainer)}>
        <Badge noIcon severity="warning">
          SENSIBILISER LE PORTEUR DE PROJET
        </Badge>
      </div>
      <p className={fr.cx("fr-mt-4v", "fr-mb-0")}>
        Une étude de faisabilité d’action à la source vise à identifier les
        solutions les plus efficaces pour réduire le bruit directement à son
        origine.
      </p>
      <div className={fr.cx("fr-mt-4v")}>
        <DiagnosticVerificationNotice
          text={
            "Vous pouvez encourager le porteur de projet à se rapprocher du gestionnaire de la source de bruit pour envisager des actions de réduction du risque sonore."
          }
        />
      </div>
    </div>
  );
};

export default DiagnosticSummarySourceAction;

const useStyles = tss.create(() => ({
  badgeContainer: {
    display: "flex",
    gap: fr.spacing("2v"),
  },
}));
