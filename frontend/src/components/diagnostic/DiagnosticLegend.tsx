import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticCursorOnScale from "./DiagnosticCursorOnScale";
import { tss } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";

type DiagnosticLegendProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticLegend = ({ diagnosticItem }: DiagnosticLegendProps) => {
  const { cx, classes } = useStyles();

  return (
    <Accordion
      label="Comprendre l’évaluation du risque selon diagBruit"
      className={cx(classes.container)}
    >
      <p>Le niveau de risque est calculé selon les critères suivants :</p>
      <ul>
        <li>niveau maximal issu des cartes de bruit</li>
        <li>multi exposition à plusieurs sources</li>
        <li>exposition en journée et / ou de nuit</li>
      </ul>
      <div className={fr.cx("fr-mt-8v")}>
        <DiagnosticCursorOnScale
          score={diagnosticItem.diagnostic.score}
          db={diagnosticItem.diagnostic.max_db_lden}
        />
      </div>
    </Accordion>
  );
};

const useStyles = tss.withName(DiagnosticLegend.name).create(() => ({
  container: {
    p: {
      marginBottom: 0,
      fontStyle: "italic",
    },
    ul: {
      paddingLeft: fr.spacing("6v"),
      fontStyle: "italic",
    },
  },
}));

export default DiagnosticLegend;
