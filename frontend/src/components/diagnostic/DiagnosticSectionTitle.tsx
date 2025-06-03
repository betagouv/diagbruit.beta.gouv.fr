import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

type DiagnosticSectionWrapperProps = {
  title: string;
  image: {
    src: string;
    width: number;
    height: number;
  };
};

const DiagnosticSectionTitle = ({
  title,
  image,
}: DiagnosticSectionWrapperProps) => {
  const { cx, classes } = useStyles();

  return (
    <div className={cx(classes.container)}>
      <div>
        <img className={cx(classes.mainIcon)} {...image} />
      </div>
      <div className={classes.content}>
        <h2 className={fr.cx("fr-h5")}>{title}</h2>
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
    h2: {
      marginBottom: fr.spacing("2v"),
    },
    [fr.breakpoints.down("md")]: {
      paddingTop: fr.spacing("2v"),
    },
  },
}));

export default DiagnosticSectionTitle;
