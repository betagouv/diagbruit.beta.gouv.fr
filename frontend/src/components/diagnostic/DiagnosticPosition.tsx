import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticParcelleSvg from "./DiagnosticParcelleSvg";
import DiagnosticParcelleSvgNotice from "./DiagnosticParcelleSvgNotice";

type DiagnosticPositionProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticPosition = ({ diagnosticItem }: DiagnosticPositionProps) => {
  const { cx, classes } = useStyles();

  const {
    parcelle: { geometry },
    diagnostic: { zones },
  } = diagnosticItem;

  return (
    <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
      <div className={fr.cx("fr-col-lg-7")}>
        <div className={cx(classes.svgContainer)}>
          <DiagnosticParcelleSvg geometry={geometry} zones={zones} />
        </div>
      </div>
      <div className={cx(classes.notice, fr.cx("fr-col-lg-5"))}>
        <DiagnosticParcelleSvgNotice zones={zones} />
      </div>
    </div>
  );
};

const useStyles = tss.create(() => ({
  svgContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "400px",
  },
  notice: {
    display: "flex",
    alignItems: "center",
  },
}));

export default DiagnosticPosition;
