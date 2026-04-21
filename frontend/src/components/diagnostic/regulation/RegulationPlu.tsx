import { fr } from "@codegouvfr/react-dsfr";
import { DiagnosticItem } from "../../../utils/types";
import DiagnosticRegulationBox from "../DiagnosticRegulationBox";

type RegulationPluProps = {
  diagnosticItem: DiagnosticItem;
};

const RegulationPlu = ({ diagnosticItem }: RegulationPluProps) => {
  const { diagnostic } = diagnosticItem;
  const hasIntersections = diagnostic.noisezone_intersections.length > 0;

  if (!hasIntersections) {
    return (
      <p className={fr.cx("fr-text--lg", "fr-mb-4v")}>
        Aucune spécificité locale inscrite au PLU.
      </p>
    );
  }

  return (
    <>
      {diagnostic.noisezone_intersections.map((noisezone, index) => (
        <div key={index} className={fr.cx("fr-mb-4v")}>
          <DiagnosticRegulationBox
            label={noisezone.label}
            content={noisezone.alert}
          />
        </div>
      ))}
    </>
  );
};

export default RegulationPlu;
