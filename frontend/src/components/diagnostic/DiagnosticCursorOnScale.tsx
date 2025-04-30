import { tss } from "tss-react/dsfr";
import DiagnosticNoiseScore from "./DiagnosticNoiseScore";
import { fr } from "@codegouvfr/react-dsfr";
import { getColorFromScore } from "../../utils/tools";

type DiagnosticCursorOnScaleProps = {
  score: number;
  db: number;
};

const SCORES = [1, 4, 7, 9];

const DiagnosticCursorOnScale = ({
  score,
  db,
}: DiagnosticCursorOnScaleProps) => {
  const { cx, classes } = useStyles();

  return (
    <div className={cx(classes.container)}>
      <div className={cx(classes.header)}>
        {SCORES.map((score) => (
          <div key={score} className={classes.headerItem}>
            <DiagnosticNoiseScore score={score} />
          </div>
        ))}
      </div>
      <div className={cx(classes.scale)}>
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className={classes.scaleSegment}
            style={{ backgroundColor: getColorFromScore(index + 1) }}
          >
            {index + 1 === score && (
              <span className={classes.cursor}>
                <div className={classes.cursorText}>{db} dB - Lden</div>
              </span>
            )}
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
  },
  headerItem: {
    display: "flex",
    justifyContent: "center",
  },
  scale: {
    marginTop: fr.spacing("8v"),
    height: fr.spacing("4v"),
    display: "grid",
    gridTemplateColumns: "repeat(10, 10%)",
  },
  scaleSegment: {
    position: "relative",
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
