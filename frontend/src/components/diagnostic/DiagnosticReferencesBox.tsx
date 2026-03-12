import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

type LinkItem = {
  url: string;
  label: string;
};

type DiagnosticReferencesBoxProps = {
  links: LinkItem[];
  title?: string;
};

const DiagnosticReferencesBox = ({
  links,
  title = "Références",
}: DiagnosticReferencesBoxProps) => {
  const { cx, classes } = useStyles();

  if (!links.length) return null;

  return (
    <div className={cx(classes.container)}>
      <p className={cx(fr.cx("fr-mb-1v"), classes.title)}>{title}</p>
      <p className={fr.cx("fr-mb-0")}>
        {links.map((link, index) => (
          <span key={index}>
            {index > 0 && " | "}
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    backgroundColor: fr.colors.decisions.background.default.grey.hover,
    padding: `${fr.spacing("4v")} ${fr.spacing("6v")}`,
  },
  title: {
    fontWeight: "bold",
    color: fr.colors.decisions.text.mention.grey.default,
  },
}));

export default DiagnosticReferencesBox;
