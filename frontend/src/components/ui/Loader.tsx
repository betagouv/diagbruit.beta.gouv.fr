import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

type LoaderProps = {
  text?: string;
  size?: "sm" | "md";
  white?: boolean;
};

export const Loader = (props: LoaderProps) => {
  const { text, size, white } = props;
  const { cx, classes } = useStyles({ size, white });

  return (
    <div className={classes.loaderContainer}>
      <div>
        <i className={fr.cx("ri-loader-4-line")} />
        {text && <p className={fr.cx("fr-mt-2v")}>{text}</p>}
      </div>
    </div>
  );
};

const useStyles = tss.withParams<LoaderProps>().create(({ size, white }) => ({
  loaderContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    i: {
      display: "inline-block",
      animation: "spin 1s linear infinite",
      color: white
        ? fr.colors.decisions.background.default.grey.default
        : fr.colors.decisions.background.actionHigh.blueFrance.default,
      ["&::before"]: {
        "--icon-size": size === "sm" ? "1.5rem" : "3rem",
      },
    },
  },
}));
