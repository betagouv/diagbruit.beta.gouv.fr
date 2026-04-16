import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import SelectorContent from "../diagnostic/SelectorContent";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { ImagePreview } from "./ImagePreview";
import { imgUrl, slugify } from "../../utils/tools";

export interface DiagPreviewProps {
    title: string;
    description: string;
    backgroundColor: string;
    image: { url: string; width: number; height: number; alternativeText: string } | null;
}

export const DiagPreview = ({ content }: { content: DiagPreviewProps[] }) => {
    const { cx, classes } = useStyles();

    const [searchParams] = useSearchParams();
    const [activeTabId, setActiveTabId] = useState(searchParams.get("tab") || slugify(content[0].title));

    const previewTabs = content.map((tab) => {
        return {
            tabId: slugify(tab.title),
            label: tab.title,
            description: tab.description,
            isDefault: activeTabId === slugify(tab.title),
            content: tab.image && (
                <div style={{ backgroundColor: tab.backgroundColor }}>
                    <ImagePreview src={imgUrl(tab.image.url)} width={tab.image.width} height={tab.image.height} alt={tab.image.alternativeText} />
                </div>
            ),
        }
    })

    return (
        <div className={cx(classes.container)}>
            <div className={cx(classes.titleContainer, "fr-col-12", "fr-grid-row")}>
                <img width={40} height={40} alt="diagnostic preview icon" src="/images/diagPreviewIcon.svg" />
                <h2>Un diagnostic complet sur les risques sonores</h2>
            </div>
            <div className={classes.contentContainer}>
                <SelectorContent
                    tabs={previewTabs}
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