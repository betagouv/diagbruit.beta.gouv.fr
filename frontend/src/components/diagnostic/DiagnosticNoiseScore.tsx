import { tss } from "tss-react";
import {
  getColorFromScore,
  getIconeFromScore,
  getTextFromScore,
} from "../../utils/tools";
import { fr } from "@codegouvfr/react-dsfr";

type DiagnosticNoiseScoreProps = {
  score: number;
  db?: number;
  disabled?: boolean;
};

const DiagnosticNoiseScore = ({
  score,
  db,
  disabled = false,
}: DiagnosticNoiseScoreProps) => {
  const { cx, classes } = useStyles({ score, disabled });

  if (disabled) {
    return (
      <div className={cx(classes.container)}>
        <i className={fr.cx("ri-forbid-fill")} /> RISQUE INDÉFINI
      </div>
    );
  }

  return (
    <div className={cx(classes.container)}>
      <i className={fr.cx(getIconeFromScore(score))} /> RISQUE{" "}
      {getTextFromScore(score)}
    </div>
  );
};

const useStyles = tss
  .withParams<{
    score: number;
    disabled: boolean;
  }>()
  .create(({ score, disabled }) => ({
    container: {
      textAlign: "center",
      backgroundColor: disabled
        ? fr.colors.decisions.text.disabled.grey.default
        : getColorFromScore(score),
      borderRadius: fr.spacing("1v"),
      padding: `${fr.spacing("3v")} ${fr.spacing("2v")}`,
      fontWeight: "bold",
      color: fr.colors.decisions.text.title.grey.default,
    },
  }));

export default DiagnosticNoiseScore;
