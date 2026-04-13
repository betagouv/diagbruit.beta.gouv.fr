import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import DiagnosticScoreOnScale from "../diagnostic/DiagnosticScoreOnScale";
import DiagnosticNoiseScore from "../diagnostic/DiagnosticNoiseScore";
import DiagnosticTag from "../diagnostic/DiagnosticTag";
import type { DiagnosticItem } from "../../utils/types";

type SonoScorePreviewProps = {
    diagnosticItem: DiagnosticItem;
};

const SonoScorePreview = ({ diagnosticItem }: SonoScorePreviewProps) => {
    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.sonoscoreContainer, "fr-col-8")}>
            <img src="/images/sonoscorePreview.png" alt="Légende du Sonoscore" className={cx(classes.image)} fetchPriority="high" />
            <DiagnosticScoreOnScale score={diagnosticItem.diagnostic.score} db={diagnosticItem.diagnostic.max_db_lden} light />
            <h3 className={cx(fr.cx("fr-text--lg", "fr-text--bold"))}>
                Source de bruit réglementée (aérien, route et ferroviaire)
            </h3>
            <div className="fr-col-md-7">
                <div className="fr-mb-2v">
                    <DiagnosticNoiseScore
                        score={diagnosticItem.diagnostic.score}
                        db={diagnosticItem.diagnostic.max_db_lden}
                        disabled={diagnosticItem.diagnostic.flags.hasNoisemapWarning}
                    />
                </div>
                <p className={cx(fr.cx("fr-mb-2v"))}>
                    Niveaux sonores équivalents :
                </p>
                {diagnosticItem.diagnostic.equivalent_ambiences.map((ambience) => (
                    <DiagnosticTag
                        key={ambience}
                        ambience={ambience}
                        className={cx(classes.redAmbienceTag, fr.cx("fr-mr-2v", "fr-mb-2v"))}
                    />
                ))}
            </div>
        </div>
    );
};

const useStyles = tss.withName(SonoScorePreview.name).create(() => ({
    sonoscoreContainer: {
        padding: fr.spacing("4v"),
        margin: `${fr.spacing("2v")} auto`,
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        boxShadow: "0px 2.05px 6.15px 0px rgba(0, 0, 18, 0.16)",
    },
    redAmbienceTag: {
        backgroundColor: fr.colors.decisions.background.actionHigh.redMarianne.active,
    },
    image: {
        width: "100%",
        height: "auto",
        aspectRatio: "16 / 9",
        objectFit: "cover",
        display: "block",
        marginBottom: fr.spacing("4v"),
    },
}));

export default SonoScorePreview;