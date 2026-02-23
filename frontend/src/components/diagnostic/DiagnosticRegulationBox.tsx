import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { ReactNode } from "react";
import { tss } from "tss-react/dsfr";

type DiagnosticRegulationBoxProps = {
  label: string;
  content: ReactNode | string;
  source?: string;
};

const DiagnosticRegulationBox = ({
  label,
  content,
  source,
}: DiagnosticRegulationBoxProps) => {
  const { cx, classes } = useStyles();

  const renderedContent =
    typeof content === "string" ? (
      <span dangerouslySetInnerHTML={{ __html: content }} />
    ) : (
      content
    );

  return (
    <div className={cx(classes.container)}>
      <Badge className={cx(classes.customBadge)} severity="warning">
        {label}
      </Badge>
      <div className={cx(classes.content, fr.cx("fr-mt-4v", "fr-mb-0"))}>
        {renderedContent}
      </div>
      {source && (
        <p className={cx(fr.cx("fr-mb-0"), classes.source)}>
          Source : {source}
        </p>
      )}
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    padding: fr.spacing("6v"),
    border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
  },
  customBadge: {
    color: fr.colors.decisions.background.flat.warning.default,
    backgroundColor: fr.colors.decisions.background.contrast.grey.default,
  },
  source: {
    color: fr.colors.decisions.text.mention.grey.default,
  },
  content: {
    ul: {
      paddingLeft: fr.spacing("8v"),
      marginBottom: fr.spacing("6v"),
      marginTop: 0,
    },
  },
}));

export default DiagnosticRegulationBox;
