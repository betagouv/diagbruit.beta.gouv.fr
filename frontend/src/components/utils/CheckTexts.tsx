import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react";

export const CheckText = ({ text }: { text: string }) => {
    const { cx, classes } = useStyles();

    return (
        <div className={cx(classes.row, "fr-col-12")}>
            <i className={cx(classes.checkIcon, "ri-check-line")} />
            <p>{text}</p>
        </div>
    )
};

export const CheckTexts = () => {
    const { cx } = useStyles();


    return (
        <div>
            <div className={cx("fr-grid-row")}>
                <CheckText text="Retrouvez facilement les réglementations en vigueur" />
            </div>
            <div className={cx("fr-grid-row")}>
                <CheckText text="Partagez rapidement l'analyse avec vos interlocuteurs" />
            </div>
            <div className={cx("fr-grid-row")}>
                <CheckText text="Accédez aux préconisations à tout moment" />
            </div>
        </div>
    );
}

const useStyles = tss.create(() => ({
    row: {
        display: "flex",
        alignItems: "center",
        gap: fr.spacing("2v"),
    },
    checkIcon: {
        color: fr.colors.decisions.background.flat.blueFrance.default,
    }
}));