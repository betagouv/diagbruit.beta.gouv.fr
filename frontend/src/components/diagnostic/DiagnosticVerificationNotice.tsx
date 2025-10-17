import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

type DiagnosticVerificationNoticeProps = {
  text: string | React.ReactNode;
};

const DiagnosticVerificationNotice: React.FC<
  DiagnosticVerificationNoticeProps
> = ({ text }) => {
  const { cx, classes } = useStyles();

  return (
    <div className={cx(classes.container)}>
      <i className={fr.cx("ri-chat-check-fill", "fr-mr-1-5v")} />
      <div>{typeof text === "string" ? <p>{text}</p> : text}</div>
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    display: "flex",
    flexWrap: "nowrap",
    padding: fr.spacing("4v"),
    backgroundColor: fr.colors.decisions.background.contrast.info.default,
    "i::before": {
      backgroundColor: fr.colors.decisions.background.flat.info.default,
    },
  },
}));

export default DiagnosticVerificationNotice;
