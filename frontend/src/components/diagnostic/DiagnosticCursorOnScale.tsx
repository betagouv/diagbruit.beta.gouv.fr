import { tss } from "tss-react/dsfr";
import DiagnosticNoiseScore from "./DiagnosticNoiseScore";
import { fr } from "@codegouvfr/react-dsfr";
import { getColorFromScore } from "../../utils/tools";

type DiagnosticCursorOnScaleProps = {
  score: number;
  db: number;
  light?: boolean;
};

const SCORES = [1, 4, 7, 9];

const DiagnosticCursorOnScale = ({
  score,
  db,
  light,
}: DiagnosticCursorOnScaleProps) => {
  const { cx, classes } = useStyles();

  return (
    <div className={cx(classes.container)}>
      {!light && (
        <div className={cx(classes.header)}>
          {SCORES.map((score) => (
            <div key={score} className={classes.headerItem}>
              <DiagnosticNoiseScore score={score} />
            </div>
          ))}
        </div>
      )}
      <div className={cx(classes.scale)}>
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className={cx(classes.scaleSegment)}
            style={{ backgroundColor: getColorFromScore(index + 1) }}
          >
            {index + 1 === score && <span className={classes.cursor} />}
          </div>
        ))}
      </div>
    </div>
  );
};

const useStyles = tss.withName(DiagnosticCursorOnScale.name).create(() => ({
  container: {
    display: "flex",
    flexDirection: "column",
    marginBottom: fr.spacing("8v"),
  },
  header: {
    display: "grid",
    gridTemplateColumns: "30% 30% 20% 20%",
    [fr.breakpoints.down("md")]: {
      fontSize: "0",
    },
  },
  headerItem: {
    display: "flex",
    justifyContent: "center",
  },
  scale: {
    height: fr.spacing("4v"),
    display: "grid",
    gridTemplateColumns: "repeat(10, 10%)",
  },
  scaleSegment: {
    position: "relative",
    height: fr.spacing("4v"),
    borderRight: `1px solid ${fr.colors.decisions.background.default.grey.active}`,
    borderLeft: `1px solid ${fr.colors.decisions.background.default.grey.active}`,
  },
  cursor: {
    display: "block",
    width: fr.spacing("3v"),
    height: fr.spacing("8v"),
    backgroundColor: fr.colors.decisions.text.actionHigh.grey.default,
    border: `2px solid ${fr.colors.decisions.background.default.grey.default}`,
    borderRadius: fr.spacing("10w"),
    margin: "auto",
    position: "absolute",
    bottom: `-${fr.spacing("2v")}`,
    left: "50%",
    transform: "translateX(-50%)",
  },
  cursorText: {
    width: "100px",
    fontWeight: "bold",
    position: "absolute",
    bottom: `-${fr.spacing("7v")}`,
    left: "50%",
    transform: "translateX(-50%)",
    textAlign: "center",
  },
}));

export default DiagnosticCursorOnScale;
