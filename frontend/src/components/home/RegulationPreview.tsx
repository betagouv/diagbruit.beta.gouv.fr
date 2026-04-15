import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

export const RegulationPreview = () => {
    const { cx, classes } = useStyles();

    return (<div className={cx(classes.regulationContainer, "fr-col-8")}>
        <img src="/images/regulationPreview.svg" width={470} height={464} fetchPriority="high" className={cx(classes.image)} />

    </div>)
}

const useStyles = tss.withName(RegulationPreview.name).create(() => ({
    regulationContainer: {
        padding: fr.spacing("4v"),
        margin: `${fr.spacing("2v")} auto`,
    },
    image: {
        width: "100%",
        height: "auto",
        display: "flex",
        backgroundColor: "white",
        boxShadow: "0 2px 6px rgba(0, 0, 18, 0.16)",
    },

}));

export default RegulationPreview;