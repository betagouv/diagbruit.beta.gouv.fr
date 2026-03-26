import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react";

export const CheckText = ({ text }: { text: string }) => {
    const { cx, classes } = useStyles();

    return (
        <>
            <i className={cx(classes.checkIcon, "ri-check-line")} />
            <p>{text}</p>
        </>
    )
};

export const CheckTexts = () => {
    const { cx } = useStyles();


    return (
        <>
            <div className={cx("fr-grid-row")}>
                <CheckText text="Retrouver facilement les réglementations en vigueurs" />
            </div>
            <div className={cx("fr-grid-row")}>
                <CheckText text="Partagez rapidement l'analyse avec vos interlocuteurs" />
            </div>
            <div className={cx("fr-grid-row")}>
                <CheckText text="Accédez aux préconisations à tout moment" />
            </div>
        </>
    );
}

const useStyles = tss.create(() => ({
    checkIcon: {
        color: fr.colors.decisions.background.flat.blueFrance.default,
    }
}));