import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

const SonoScorePreview = () => {
    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.sonoscoreContainer, "fr-col-8")}>
            <img src="/images/sonoscorePreview.svg" width={483} height={453} fetchPriority="high" className={cx(classes.image)} />
        </div>
    );
};

const useStyles = tss.withName(SonoScorePreview.name).create(() => ({
    sonoscoreContainer: {
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

export default SonoScorePreview;