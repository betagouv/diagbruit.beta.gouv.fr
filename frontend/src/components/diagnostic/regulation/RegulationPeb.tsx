import { fr } from "@codegouvfr/react-dsfr";
import { getPebRegulationTextFromZone } from "../../../utils/texts/regulation";
import { DiagnosticItem } from "../../../utils/types";
import DiagnosticRegulationBox from "../DiagnosticRegulationBox";

type RegulationPebProps = {
  diagnosticItem: DiagnosticItem;
};

const RegulationPeb = ({ diagnosticItem }: RegulationPebProps) => {
  const { diagnostic } = diagnosticItem;
  const hasIntersections = diagnostic.air_intersections.length > 0;

  if (!hasIntersections) {
    return (
      <p className={fr.cx("fr-text--lg", "fr-mb-4v")}>
        Votre parcelle n'est pas impactée par la réglementation Aérienne.
      </p>
    );
  }

  return (
    <div className={fr.cx("fr-mb-4v")}>
      <DiagnosticRegulationBox
        label={`Zone ${diagnostic.air_intersections[0].zone}`}
        content={
          getPebRegulationTextFromZone(diagnostic.air_intersections[0].zone) ||
          ""
        }
        source="PEB"
      />
    </div>
  );
};

export default RegulationPeb;
