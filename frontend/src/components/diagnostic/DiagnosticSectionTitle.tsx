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
  },
  mainIcon: {
    padding: fr.spacing("1v"),
  },
  content: {
    paddingTop: fr.spacing("11v"),
    [fr.breakpoints.down("md")]: {
      paddingTop: fr.spacing("2v"),
    },
  },
}));

export default DiagnosticSectionTitle;
