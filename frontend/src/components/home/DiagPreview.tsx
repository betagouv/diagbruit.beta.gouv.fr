import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import SelectorContent from "../diagnostic/SelectorContent";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import type { DiagnosticItem } from "../../utils/types";
import SonoScorePreview from "./SonoScorePreview";

const dummyDiagnosticItem: DiagnosticItem = {
    parcelle: {
        code_insee: "33063",
        section: "DL",
        numero: "0039",
        geometry: [[[0, 0]]],
    },
    diagnostic: {
        score: 10,
        max_db_lden: 75,
        min_db_lden: 70,
        isolation_min: 30,
        isolation_max: 38,
        flags: {
            hasClassificationWarning: false,
            hasNoisemapWarning: false,
            isMultiExposedSources: true,
            isMultiExposedLandSources: true,
            isMultiExposedLandDistinctTypeSources: false,
            isMultiExposedLdenLn: false,
            isPriorityZone: false,
        },
        land_intersections_ld: [],
        land_intersections_ln: [],
        zones: [],
        air_intersections: [],
        soundclassification_intersections: [],
        noisesource_intersections: [],
        noisezone_intersections: [],
        equivalent_ambiences: ["Rue commerçante animée", "Avenue urbaine"],
    },
};


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
                <div className={cx(classes.diagPreviewContainer, fr.cx("fr-p-10v"))}>
                    <SonoScorePreview diagnosticItem={dummyDiagnosticItem} />
                </div>
            ),
        },
        {
            tabId: "reglementation",
            label: "Réglementation",
            description: "Résumé clair des réglementations applicables sur la parcelle (classement sonore, PEB, PLU, PPBE, et isolation réglementaire).",
            isDefault: activeTabId === "reglementation",
            content: (
                <>
                    Tab2
                </>
            ),
        },
        {
            tabId: "solutions",
            label: "Solutions techniques et économiques",
            description: "Analyse de la position du bâti au regard des risques sonores, avec des préconisations concrètes d'isolation et d'aménagement.",
            isDefault: activeTabId === "solutions",
            content: (
                <>
                    Tab3
                </>
            ),
        },
    ];

    return (
        <div className={fr.cx("fr-my-8v",)}>
            <h2>Un diagnostic complet sur les risques sonores</h2>
            <SelectorContent
                tabs={reviewTabs}
                activeTabId={activeTabId}
                onTabChange={(tabId) => {
                    setActiveTabId(tabId);
                }}
            />
            <div className={fr.cx("fr-my-4v", "fr-ml-4v")}>
                <a href="/diagnostic" className={fr.cx("fr-link", "fr-icon-arrow-right-line", "fr-link--icon-right")}>
                    Diagnostiquer une parcelle
                </a>
            </div>
        </div>
    )

}

const useStyles = tss.create(() => ({
    diagPreviewContainer: {
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        width: "100%",
    }

}));

export default DiagPreview;