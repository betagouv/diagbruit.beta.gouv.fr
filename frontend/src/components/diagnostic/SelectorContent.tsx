import { fr } from "@codegouvfr/react-dsfr";
import { ReactNode } from "react";
import { tss } from "tss-react/dsfr";
import { encode } from "../../utils/compression";

export interface SelectorTab {
    tabId: string;
    label: string;
    content: ReactNode;
    description?: string;
}

interface SelectorContentProps {
    tabs: SelectorTab[];
    activeTabId: string;
    border?: boolean;
    onTabChange: (tabId: string) => void;
}

const SelectorContent = ({ tabs, activeTabId, border = false, onTabChange }: SelectorContentProps) => {
    const { cx, classes } = useStyles({ border });

    return (
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            <div className={cx(classes.selectorColumn, fr.cx("fr-col-4"))}>
                <nav>
                    <ul className={cx(classes.selectorList)}>
                        {tabs.map((tab) => (
                            <li
                                key={tab.tabId}
                                className={cx(classes.selectorItem, tab.tabId === activeTabId && classes.selectorItemActive)}
                                onClick={() => onTabChange(tab.tabId)}
                            >
                                {tab.label}
                                {tab.description && (
                                    <span className={cx(classes.selectorItemDescription)}>{tab.description}</span>
                                )}
                            </li>
                        ))}
                        <li>
                            <div className={cx(classes.selectorLink)}>
                                <a href={`/diagnostic?parcelleSearch=${encode(true)}`} className={fr.cx("fr-link", "fr-icon-arrow-right-line", "fr-link--icon-right")}>
                                    Diagnostiquer une parcelle
                                </a>
                            </div>
                        </li>
                    </ul>

                </nav>

            </div>
            <div className={fr.cx("fr-col-8")}>
                {tabs.find((tab) => tab.tabId === activeTabId)?.content}
            </div>
        </div>
    );
};

const useStyles = tss.withName(SelectorContent.name).withParams<{ border: boolean }>().create(({ border }) => ({
    selectorColumn: {
        display: "flex",
        flexDirection: "column",
    },
    selectorList: {
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("1v"),
        borderRight: `${border ? `1px solid ${fr.colors.decisions.border.default.grey.default}` : "none"}`,
    },
    selectorLink: {
        marginLeft: fr.spacing('4v'),
        marginTop: fr.spacing('4v'),
    },
    selectorItem: {
        padding: `${fr.spacing("2v")} ${fr.spacing("4v")}`,
        cursor: "pointer",
        borderLeft: `2px solid transparent`,
        fontWeight: 700,
        color: fr.colors.decisions.text.default.grey.default,
        "&:hover": {
            borderLeftColor: fr.colors.decisions.background.flat.blueFrance.default,
            color: fr.colors.decisions.text.actionHigh.blueFrance.default,
            "& span": {
                color: fr.colors.decisions.text.actionHigh.blueFrance.default,
            },
        },
    },
    selectorItemActive: {
        borderLeftColor: fr.colors.decisions.background.flat.blueFrance.default,
        color: fr.colors.decisions.text.actionHigh.blueFrance.default,
        "& span": {
            color: fr.colors.decisions.text.actionHigh.blueFrance.default,
        },
    },
    selectorItemDescription: {
        marginTop: fr.spacing("4v"),
        display: "block",
        fontWeight: 400,
        fontSize: fr.typography[18].style.fontSize,
        color: fr.colors.decisions.text.mention.grey.default,
        lineHeight: fr.typography[18].style.lineHeight,
    },
}));

export default SelectorContent;