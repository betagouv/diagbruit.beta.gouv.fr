import { tss } from "tss-react";
import {
  getColorFromScore,
  getIconeFromScore,
  getTextFromScore,
} from "../../utils/tools";
import { fr } from "@codegouvfr/react-dsfr";

type DiagnosticNoiseScoreProps = {
  score: number;
  db: number;
};

const DiagnosticNoiseScore = ({ score, db }: DiagnosticNoiseScoreProps) => {
  const { cx, classes } = useStyles({ score });

  return (
    <div className={cx(classes.container)}>
      <i className={fr.cx(getIconeFromScore(score))} /> RISQUE{" "}
      {getTextFromScore(score)} - {db} dB Lden
    </div>
  );
};

const useStyles = tss
  .withName(DiagnosticNoiseScore.name)
  .withParams<{
    score: number;
  }>()
  .create(({ score }) => ({
    container: {
      display: "inline-block",
      backgroundColor: getColorFromScore(score),
      borderRadius: fr.spacing("1v"),
      padding: `${fr.spacing("3v")} ${fr.spacing("2v")}`,
      fontWeight: "bold",
      color: fr.colors.decisions.text.title.grey.default,
    },
  }));

export default DiagnosticNoiseScore;
