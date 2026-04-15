import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import SelectorContent from "../diagnostic/SelectorContent";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import SonoScorePreview from "./SonoScorePreview";
import RegulationPreview from "./RegulationPreview";
import SolutionPreview from "./SolutionPreview";
import { dummyDiagnosticItem } from "../utils/DummyDiag";

export const DiagPreview = () => {

    const [searchParams] = useSearchParams();
    const { cx, classes } = useStyles();

    const [activeTabId, setActiveTabId] = useState(searchParams.get("tab") || "sonoscore");

    const reviewTabs = [
        {
            tabId: "sonoscore",
            label: "Résumé du diagnostic",
            description: "Niveau d'exposition sonore de la parcelle, calculé à partir des données certifiées sur le bruit routier, ferroviaire et aérien.",
            isDefault: activeTabId === "sonoscore",
            content: (
                <div className={cx(classes.sonoscorePreviewContainer, fr.cx("fr-p-10v"))}>
                    <SonoScorePreview />
                </div>
            ),
        },
        {
            tabId: "reglementation",
            label: "Réglementation",
            description: "Résumé clair des réglementations applicables sur la parcelle (classement sonore, PEB, PLU, PPBE, et isolation réglementaire).",
            isDefault: activeTabId === "reglementation",
            content: (
                <div className={cx(classes.regulationPreviewContainer, fr.cx("fr-p-10v"))}>
                    <RegulationPreview />
                </div>
            ),
        },
        {
            tabId: "solutions",
            label: "Solutions techniques et économiques",
            description: "Analyse de la position du bâti au regard des risques sonores, avec des préconisations concrètes d'isolation et d'aménagement.",
            isDefault: activeTabId === "solutions",
            content: (
                <div className={cx(classes.solutionPreviewContainer, fr.cx("fr-p-10v"))}>
                    <SolutionPreview />
                </div>
            ),
        },
    ];

    return (
        <div className={cx(classes.container)}>
            <div className={cx(classes.titleContainer, "fr-col-12", "fr-grid-row")}>
                <img width={40} height={40} alt="diagnostic preview icon" src="/images/diagPreviewIcon.svg" />
                <h2>Un diagnostic complet sur les risques sonores</h2>
            </div>
            <SelectorContent
                tabs={reviewTabs}
                activeTabId={activeTabId}
                onTabChange={(tabId) => {
                    setActiveTabId(tabId);
                }}
                diag
            />
        </div>
    )

}

const useStyles = tss.create(() => ({
    container: {
        borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        padding: `${fr.spacing("8v")} 0`,
        marginLeft: "calc(-50vw + 50%)",
        marginRight: "calc(-50vw + 50%)",
        paddingLeft: "calc(50vw - 50%)",
        paddingRight: "calc(50vw - 50%)",
    },
    titleContainer: {
        gap: fr.spacing("4v"),
    },
    sonoscorePreviewContainer: {
        backgroundColor: fr.colors.decisions.background.alt.redMarianne.active,
        width: "100%",
    },
    regulationPreviewContainer: {
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        width: "100%",
    },
    solutionPreviewContainer: {
        backgroundColor: fr.colors.decisions.background.alt.grey.default,
        width: "100%",
    }


}));

export default DiagPreview;