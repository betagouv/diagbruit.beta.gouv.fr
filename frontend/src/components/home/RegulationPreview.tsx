import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import DiagnosticRegulationBox from "../diagnostic/DiagnosticRegulationBox";
import DiagnosticRegulation from "../diagnostic/DiagnosticRegulation";
import { DiagnosticItem } from "../../utils/types";

type SonoScorePreviewProps = {
    diagnosticItem: DiagnosticItem;
};

export const RegulationPreview = ({ diagnosticItem }: SonoScorePreviewProps) => {
    const { cx, classes } = useStyles();

    return (<div className={cx(classes.regulationContainer, "fr-col-8")}>
        <p className={cx(fr.cx("fr-text--lg", "fr-text--bold"))}>Réglementation</p>
        <DiagnosticRegulation diagnosticItem={diagnosticItem} />
        <DiagnosticRegulationBox
            label="Zone à enjeux"
            content={
                <>
                    <p className={fr.cx("fr-mb-4v")}>
                        Les zones à enjeux sont exposés aux bruits aériens.
                        Il est recommendé de construire en limitant le nombre d'habitants et
                        en adaptant votre conception (implantation, barrière anti-bruit, isolation, etc.)
                        pour réduire les risques sanitaires.
                    </p>
                    <p>
                        Source : PPBE
                    </p>
                </>
            }
        />
    </div>)
}

const useStyles = tss.withName(RegulationPreview.name).create(() => ({
    regulationContainer: {
        padding: fr.spacing("4v"),
        margin: `${fr.spacing("2v")} auto`,
        backgroundColor: fr.colors.decisions.background.default.grey.default,

        boxShadow: "0px 2.05px 6.15px 0px rgba(0, 0, 18, 0.16)",

    },

}));

export default RegulationPreview;