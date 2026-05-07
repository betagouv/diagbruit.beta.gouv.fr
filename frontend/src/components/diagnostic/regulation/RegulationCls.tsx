import { fr } from "@codegouvfr/react-dsfr";
import type { DiagnosticItem } from "../../../utils/types";
import FakeLinkComponent from "../../ui/FakeLinkComponent";
import DiagnosticRegulationBox from "../DiagnosticRegulationBox";
import { useSearchParams } from "react-router-dom";

type RegulationClsProps = {
  diagnosticItem: DiagnosticItem;
};

const RegulationCls = ({ diagnosticItem }: RegulationClsProps) => {
  const { diagnostic } = diagnosticItem;

  const [searchParams, setSearchParams] = useSearchParams();

  const goToTab = (str: string) =>
    setSearchParams(new URLSearchParams({ ...Object.fromEntries(searchParams), tab: str }));

  const intersections = diagnostic.soundclassification_intersections;

  const hasIntersections =
    intersections.length > 0;

  if (!hasIntersections) {
    return (
      <p className={fr.cx("fr-text--lg", "fr-mb-4v")}>
        Votre parcelle n'est pas impactée par le classement sonore.
      </p>
    );
  }

  const firstSoundCategory = intersections[0].sound_category;
  const allSameSoundCategory = intersections.every((i) => i.sound_category === firstSoundCategory);

  return (
    <div className={fr.cx("fr-mb-4v")}>
      <DiagnosticRegulationBox
        label="Parcelle soumise au classement sonore"
        content={
          <>
            <p className={fr.cx("fr-mb-0")}>
              La parcelle est exposée à {diagnostic.soundclassification_intersections.length} sources de bruit de {allSameSoundCategory ? `catégorie ${firstSoundCategory}` : "différentes catégories."}
            </p>
            <p className={fr.cx("fr-mb-4v")}>
              Vous avez une obligation réglementaire d'isoler votre bâtiment.
            </p>
          </>
        }
      />
    </div>
  );
};

export default RegulationCls;
