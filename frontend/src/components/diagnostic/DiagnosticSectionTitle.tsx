import { type FrIconClassName, fr, type RiIconClassName } from "@codegouvfr/react-dsfr";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { tss } from "tss-react/dsfr";

type DiagnosticSectionWrapperProps = {
  title: string;
  image?: {
    src: string;
    width: number;
    height: number;
  };
  icon?: FrIconClassName | RiIconClassName;
  isSecondTitle?: boolean;
  hint?: string;
};

const DiagnosticSectionTitle = ({
  title,
  image,
  icon,
  isSecondTitle,
  hint,
}: DiagnosticSectionWrapperProps) => {
  const { cx, classes } = useStyles();

  const iconElement = image ? (
    <img className={cx(classes.mainImage)} {...image} alt="title icon" />
  ) : icon ? (
    <i className={cx(fr.cx(icon), classes.mainIcon)} />
  ) : null;

  return (
    <div className={cx(classes.container)}>
      <div>{iconElement}</div>
      <div className={classes.content}>
        {isSecondTitle ? (
          <h4 className={fr.cx("fr-h6")}>{title}</h4>
        ) : (
          <h3 className={fr.cx("fr-h5")}>{title}</h3>
        )}
      </div>
      {hint && (
        <div className={cx(classes.tooltipIcon)}>
          <Tooltip kind="hover" title={hint} />
        </div>
      )}
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    display: "flex",
    [fr.breakpoints.down("md")]: {
      flexDirection: "column",
    },
    marginBottom: fr.spacing("4v"),
  },
  mainImage: {
    padding: fr.spacing("1v"),
    marginRight: fr.spacing("2v"),
  },
  mainIcon: {
    marginRight: fr.spacing("1v"),
  },
  content: {
    display: "flex",
    alignItems: "end",
    "h3, h4": {
      marginBottom: fr.spacing("2v"),
    },
    [fr.breakpoints.down("md")]: {
      paddingTop: fr.spacing("2v"),
    },
  },
  tooltipIcon: {
    marginLeft: fr.spacing("1v"),
  },
}));

export default DiagnosticSectionTitle;
