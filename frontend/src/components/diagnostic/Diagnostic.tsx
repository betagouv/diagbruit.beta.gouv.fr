import { fr } from "@codegouvfr/react-dsfr";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticHero from "./DiagnosticHero";
import DiagnosticLegalInfos from "./DiagnosticLegalInfos";
import { tss } from "tss-react/dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";

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
      {/* TO REMOVE */}
      <Accordion label="Voir le retour de l'API">
        <pre>{JSON.stringify(diagnosticItem, null, 2)}</pre>
      </Accordion>
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
