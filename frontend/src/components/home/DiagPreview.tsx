import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import SelectorContent from "../diagnostic/SelectorContent";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { ImagePreview } from "./ImagePreview";

export const DiagPreview = () => {
    const { cx, classes } = useStyles();

    const [searchParams] = useSearchParams();
    const [activeTabId, setActiveTabId] = useState(searchParams.get("tab") || "sonoscore");

    const reviewTabs = [
        {
            tabId: "sonoscore",
            label: "Résumé du diagnostic",
            description: "Niveau d'exposition sonore de la parcelle, calculé à partir des données certifiées sur le bruit routier, ferroviaire et aérien.",
            isDefault: activeTabId === "sonoscore",
            content: (
                <div className={classes.sonoscorePreviewContainer}>
                    <ImagePreview src="/images/sonoscorePreview.svg" width={470} height={521} alt="Preview du sonoscore diagBruit" />
                </div>
            ),
        },
        {
            tabId: "reglementation",
            label: "Réglementation",
            description: "Résumé clair des réglementations applicables sur la parcelle (classement sonore, PEB, PLU, PPBE, et isolation réglementaire).",
            isDefault: activeTabId === "reglementation",
            content: (
                <div className={classes.regulationPreviewContainer}>
                    <ImagePreview src="/images/regulationPreview.svg" width={470} height={464} alt="Preview des réglementations" />
                </div>
            ),
        },
        {
            tabId: "solutions",
            label: "Solutions techniques et économiques",
            description: "Analyse de la position du bâti au regard des risques sonores, avec des préconisations concrètes d'isolation et d'aménagement.",
            isDefault: activeTabId === "solutions",
            content: (
                <div className={classes.solutionPreviewContainer}>
                    <ImagePreview src="/images/solutionPreview.svg" width={470} height={521} alt="Preview des solutions techniques" />
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
            <div className={classes.contentContainer}>
                <SelectorContent
                    tabs={reviewTabs}
                    activeTabId={activeTabId}
                    onTabChange={(tabId) => {
                        setActiveTabId(tabId);
                    }}
                />
            </div>
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
    contentContainer: {
        width: "100%",
    },
    sonoscorePreviewContainer: {
        backgroundColor: fr.colors.decisions.background.alt.redMarianne.active,
        padding: fr.spacing('10v')

    },
    regulationPreviewContainer: {
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        padding: fr.spacing('10v')
    },
    solutionPreviewContainer: {
        backgroundColor: fr.colors.decisions.background.alt.grey.default,
        padding: fr.spacing('10v')
    }


}));

export default DiagPreview;