import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import SelectorContent from "../diagnostic/SelectorContent";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import type { DiagnosticItem, Geometry } from "../../utils/types";
import SonoScorePreview from "./SonoScorePreview";
import RegulationPreview from "./RegulationPreview";
import SolutionPreview from "./SolutionPreview";

const parcelRing = [
    [-0.5731920897960663, 44.81322138712943],
    [-0.5731411278247833, 44.81333935942152],
    [-0.5730418860912323, 44.81335267885870],
    [-0.5730016529560089, 44.81335743579979],
    [-0.5729909241199493, 44.81335838718795],
    [-0.5729842185974121, 44.81336504690475],
    [-0.5729144811630249, 44.81337360939662],
    [-0.5728407204151154, 44.81337741494815],
    [-0.5728340148925781, 44.81332794275863],
    [-0.5728246271610260, 44.81323470659384],
    [-0.5728983879089355, 44.81323090103291],
    [-0.5729882419109344, 44.81322519269099],
    [-0.5731800198554993, 44.81321472739606],
    [-0.5731920897960663, 44.81322138712943],
];

const dummyDiagnosticItem: DiagnosticItem = {
    parcelle: {
        code_insee: "33063",
        section: "DL",
        numero: "0039",
        geometry: [parcelRing] as unknown as Geometry,
    },
    diagnostic: {
        score: 10,
        max_db_lden: 75,
        min_db_lden: 65,
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
        land_intersections_ld: [
            {
                typeterr: "RD",
                typesource: "R",
                indicetype: "Lden",
                codeinfra: "A630",
                legende: 75,
                cbstype: "CBS_A",
                geometry_intersection: [parcelRing] as unknown as Geometry,
                percent_impacted: 60,
                direction: "N",
            },
            {
                typeterr: "RD",
                typesource: "R",
                indicetype: "Lden",
                codeinfra: "A630",
                legende: 70,
                cbstype: "CBS_A",
                geometry_intersection: [parcelRing] as unknown as Geometry,
                percent_impacted: 30,
                direction: "NE",
            },
            {
                typeterr: "FERRE",
                typesource: "F",
                indicetype: "Lden",
                codeinfra: "LGV_SEA",
                legende: 65,
                cbstype: "CBS_F",
                geometry_intersection: [parcelRing] as unknown as Geometry,
                percent_impacted: 10,
                direction: "E",
            },
        ],
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
                <div className={cx(classes.sonoscorePreviewContainer, fr.cx("fr-p-10v"))}>
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
                <div className={cx(classes.regulationPreviewContainer, fr.cx("fr-p-10v"))}>
                    <RegulationPreview diagnosticItem={dummyDiagnosticItem} />
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
                    <SolutionPreview diagnosticItem={dummyDiagnosticItem} />
                </div>
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
    sonoscorePreviewContainer: {
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        width: "100%",
    },
    regulationPreviewContainer: {
        backgroundColor: fr.colors.decisions.background.alt.redMarianne.active,
        width: "100%",
    },
    solutionPreviewContainer: {
        backgroundColor: fr.colors.decisions.background.alt.grey.default,
        width: "100%",
    }


}));

export default DiagPreview;