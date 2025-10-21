import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

type DiagnosticSectionWrapperProps = {
  title: string;
  image: {
    src: string;
    width: number;
    height: number;
  };
  isSecondTitle?: boolean;
};

const DiagnosticSectionTitle = ({
  title,
  image,
  isSecondTitle,
}: DiagnosticSectionWrapperProps) => {
  const { cx, classes } = useStyles();

  return (
    <div className={cx(classes.container)}>
      <div>
        <img className={cx(classes.mainIcon)} {...image} />
      </div>
      <div className={classes.content}>
        {isSecondTitle ? (
          <h4 className={fr.cx("fr-h6")}>{title}</h4>
        ) : (
          <h3 className={fr.cx("fr-h5")}>{title}</h3>
        )}
      </div>
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
  mainIcon: {
    padding: fr.spacing("1v"),
    marginRight: fr.spacing("2v"),
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
}));

export default DiagnosticSectionTitle;
