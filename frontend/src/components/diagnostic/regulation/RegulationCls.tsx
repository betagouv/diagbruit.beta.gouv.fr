import { fr } from "@codegouvfr/react-dsfr";
import type { DiagnosticItem } from "../../../utils/types";
import FakeLinkComponent from "../../ui/FakeLinkComponent";
import DiagnosticRegulationBox from "../DiagnosticRegulationBox";

type RegulationClsProps = {
  diagnosticItem: DiagnosticItem;
};

const RegulationCls = ({ diagnosticItem }: RegulationClsProps) => {
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
            <FakeLinkComponent onClick={() => {
              (
                document.querySelector(
                  '[id^="tabpanel-"][id$="-1"]',
                ) as HTMLElement
              )?.click();
            }}>
              Voir la valeur de l'isolation réglementaire{" "}
              <i className={fr.cx("ri-arrow-right-line")} />
            </FakeLinkComponent>
          </>
        }
      />
    </div>
  );
};

export default RegulationCls;
