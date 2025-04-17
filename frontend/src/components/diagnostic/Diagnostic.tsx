import { fr } from "@codegouvfr/react-dsfr";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticHero from "./DiagnosticHero";
import DiagnosticLegalInfos from "./DiagnosticLegalInfos";
import { tss } from "tss-react/dsfr";

type DiagnosticProps = {
  diagnosticItem: DiagnosticItem;
  isLoading: boolean;
};

const Diagnostic = ({ diagnosticItem }: DiagnosticProps) => {
  const { cx, classes } = useStyles();

  return (
    <div className={cx(classes.container, fr.cx("fr-py-10v"))}>
      <DiagnosticHero diagnosticItem={diagnosticItem} />
      <DiagnosticLegalInfos diagnosticItem={diagnosticItem} />
    </div>
  );
};

const useStyles = tss.withName(Diagnostic.name).create(() => ({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("6v"),
  },
}));

export default Diagnostic;
