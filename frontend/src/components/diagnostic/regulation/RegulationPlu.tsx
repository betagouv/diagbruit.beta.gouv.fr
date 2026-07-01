import { fr } from "@codegouvfr/react-dsfr";
import { DiagnosticItem } from "../../../utils/types";
import DiagnosticRegulationBox from "../DiagnosticRegulationBox";

type RegulationPluProps = {
  diagnosticItem: DiagnosticItem;
};

const RegulationPlu = ({ diagnosticItem }: RegulationPluProps) => {
  const { diagnostic } = diagnosticItem;

  const uniqueNoisezones = Array.from(
    new Map(
      diagnostic.noisezone_intersections.map((noisezone) => [
        noisezone.alert_slug,
        noisezone,
      ]),
    ).values(),
  );

  if (uniqueNoisezones.length === 0) {
    return (
      <p className={fr.cx("fr-text--lg", "fr-mb-4v")}>
        Aucune spécificité locale inscrite au PLU.
      </p>
    );
  }


  return (
    <>
      {uniqueNoisezones.map((noisezone) => (
        <div key={noisezone.alert_slug} className={fr.cx("fr-mb-4v")}>
          <DiagnosticRegulationBox
            label={noisezone.label ?? ""}
            content={noisezone.content ?? ""}
            source={noisezone.source ?? ""}
            reference={noisezone.reference ?? ""}
          />
        </div>
      ))}
    </>
  );
};

export default RegulationPlu;
