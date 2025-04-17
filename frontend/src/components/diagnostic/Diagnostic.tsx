import { fr } from "@codegouvfr/react-dsfr";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticHero from "./DiagnosticHero";

type DiagnosticProps = {
  diagnosticItem: DiagnosticItem;
  isLoading: boolean;
};

const Diagnostic = ({ diagnosticItem }: DiagnosticProps) => {
  return (
    <div className={fr.cx("fr-py-10v")}>
      <DiagnosticHero diagnosticItem={diagnosticItem} />
    </div>
  );
};

export default Diagnostic;
