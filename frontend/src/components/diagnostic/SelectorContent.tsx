import { fr } from "@codegouvfr/react-dsfr";
import { ReactNode, useState } from "react";
import { tss } from "tss-react/dsfr";

export interface SelectorTab {
    tabId: string;
    label: string;
    content: ReactNode;
    description?: string;
}

interface SelectorContentProps {
    tabs: SelectorTab[];
    activeTabId: string;
    onTabChange: (tabId: string) => void;
}

const SelectorContent = ({ tabs, activeTabId, onTabChange }: SelectorContentProps) => {
    const { cx, classes } = useStyles();

    return (
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            <div className={fr.cx("fr-col-3")}>
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
                    </ul>
                </nav>
            </div>
            <div className={fr.cx("fr-col-9")}>
                {tabs.find((tab) => tab.tabId === activeTabId)?.content}
            </div>
        </div>
    );
};

const useStyles = tss.withName(SelectorContent.name).create(() => ({
    selectorList: {
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("1v"),
        borderRight: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    },
    selectorItem: {
        padding: `${fr.spacing("2v")} ${fr.spacing("4v")}`,
        cursor: "pointer",
        borderLeft: `3px solid transparent`,
        fontWeight: 700,
        color: fr.colors.decisions.text.default.grey.default,
        "&:hover": {
            borderLeftColor: fr.colors.decisions.border.default.blueFrance.default,
            color: fr.colors.decisions.text.active.blueFrance.default,
            "& span": {
                color: fr.colors.decisions.text.active.blueFrance.default,
            },
        },
    },
    selectorItemActive: {
        borderLeftColor: fr.colors.decisions.border.default.blueFrance.default,
        color: fr.colors.decisions.text.active.blueFrance.default,
        "& span": {
            color: fr.colors.decisions.text.active.blueFrance.default,
        },
    },
    selectorItemDescription: {
        marginTop: fr.spacing("4v"),
        display: "block",
        fontWeight: 400,
        fontSize: fr.typography[17].style.fontSize,
        color: fr.colors.decisions.text.mention.grey.default,
        lineHeight: fr.typography[17].style.lineHeight,
    },
}));

export default SelectorContent;