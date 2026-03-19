import { fr } from "@codegouvfr/react-dsfr";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import type React from "react";
import { tss } from "tss-react/dsfr";
import DiagnosticSectionTitle from "./DiagnosticSectionTitle";
import DiagnosticVerificationNotice from "./DiagnosticVerificationNotice";

const DiagnosticSummaryNoiseReductionScreen: React.FC = () => {
  const { cx, classes } = useStyles();

  return (
    <div className={fr.cx("fr-mt-14v")}>
      <DiagnosticSectionTitle
        title="Utilisation du projet comme un écran anti-bruit"
        image={{
          src: "/images/innovation.svg",
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
        Un projet de construction peut être pensé de façon à{" "}
        <strong>contribuer à la réduction du risque bruit.</strong>
      </p>
      <div className={fr.cx("fr-mt-6v")}>
        <DiagnosticVerificationNotice
          text={
            <>
              Vous pouvez encourager le porteur de projet à concevoir et
              présenter un plan intégrant certains éléments de bâtis (comme des
              murs de propriété, des garages ou des locaux collectifs, etc.) de
              manière à ce qu’ils jouent un{" "}
              <strong>rôle d’écran antibruit.</strong>
            </>
          }
        />
      </div>
    </div>
  );
};

export default DiagnosticSummaryNoiseReductionScreen;

const useStyles = tss.create(() => ({
  badgeContainer: {
    display: "flex",
    gap: fr.spacing("2v"),
  },
}));
