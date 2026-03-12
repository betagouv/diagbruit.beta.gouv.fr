import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import type { DiagnosticItem } from "../../../utils/types";
import DiagnosticRegulationBox from "../DiagnosticRegulationBox";

type RegulationClsProps = {
  diagnosticItem: DiagnosticItem;
};

const RegulationCls = ({ diagnosticItem }: RegulationClsProps) => {
  const { cx, classes } = useStyles();
  const { diagnostic } = diagnosticItem;
  const hasIntersections =
    diagnostic.soundclassification_intersections.length > 0;

  if (!hasIntersections) {
    return (
      <p className={fr.cx("fr-text--lg", "fr-mb-4v")}>
        Votre parcelle n'est pas impactée par le classement sonore.
      </p>
    );
  }

  return (
    <div className={fr.cx("fr-mb-4v")}>
      <DiagnosticRegulationBox
        label="Parcelle soumise au classement sonore"
        content={
          <>
            <p className={fr.cx("fr-mb-4v")}>
              Vous avez une obligation réglementaire d'isoler votre bâtiment.
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
              Voir la valeur de l'isolation réglementaire{" "}
              <i className={fr.cx("ri-arrow-right-line")} />
            </p>
          </>
        }
      />
    </div>
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

export default RegulationCls;
