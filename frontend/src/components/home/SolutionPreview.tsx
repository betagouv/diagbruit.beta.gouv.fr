import { tss } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";

export const SolutionPreview = () => {
    const { cx, classes } = useStyles();

    return (<div className={cx(classes.solutionContainer, "fr-col-8")}>
        <img src="/images/solutionPreview.svg" width={470} height={521} fetchPriority="high" className={cx(classes.image)} />
    </div>)
}

const useStyles = tss.withName(SolutionPreview.name).create(() => ({
    solutionContainer: {
        padding: fr.spacing("4v"),
        margin: `${fr.spacing("2v")} auto`,
    },
    image: {
        width: "100%",
        height: "auto",
        display: "flex",
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        boxShadow: "0 2px 6px rgba(0, 0, 18, 0.16)",
    },

}));


export default SolutionPreview;