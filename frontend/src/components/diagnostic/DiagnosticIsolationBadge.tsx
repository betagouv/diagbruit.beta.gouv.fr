import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react";

type DiagnosticIsolationBadgeProps = {
  isolation: number;
  title?: string;
};

const DiagnosticIsolationBadge = ({
  isolation,
  title,
}: DiagnosticIsolationBadgeProps) => {
  const { cx, classes } = useStyles();

  return (
    <div className={cx(classes.container)}>
      <div>{title || "Isolement théorique"}</div>
      <div className={classes.isolation}>{isolation} dB</div>
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    backgroundColor: fr.colors.decisions.background.alt.greenEmeraude.default,
    display: "inline-block",
    borderRadius: fr.spacing("2v"),
    padding: `${fr.spacing("2v")} ${fr.spacing("4v")} ${fr.spacing(
      "3v"
    )} ${fr.spacing("4v")}`,
    border: `1px dashed ${fr.colors.decisions.text.actionHigh.greenEmeraude.default}`,
    color: fr.colors.decisions.text.actionHigh.greenEmeraude.default,
    textAlign: "center",
    ...fr.typography[18].style,
    marginBottom: 0,
  },
  isolation: {
    marginTop: fr.spacing("1v"),
    fontWeight: "bold",
    fontSize: fr.typography[4].style.fontSize,
  },
}));

export default DiagnosticIsolationBadge;
