import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect } from "react";
import { tss } from "tss-react/dsfr";
import { CheckTexts } from "../utils/CheckTexts";
import DiagnosticEmailForm, { modal } from "./DiagnosticEmailForm";

export default function DiagnosticReceiveByMail() {
    const { cx, classes } = useStyles();

    useEffect(() => {
        setTimeout(() => {
            modal.open();
        }, 5000);
    }, []);


    return (
        <div className={cx(classes.container, "fr-grid-row")}>
            <div className={cx(classes.tileTitle, "fr-col-4")}>
                <img src="/images/document-download.svg" alt="" />
                <h4 className={fr.cx("fr-h6")}>Recevoir le diagnostic par email</h4>
            </div>
            <div className={cx(classes.tileContent, "fr-col-8")}>
                {<CheckTexts />}
                <Button
                    priority="primary"
                    iconId="ri-mail-line"
                    onClick={() => {
                        modal.open();
                    }}
                    className={fr.cx("fr-mt-4v")}
                >
                    Recevoir le diagnostic
                </Button>
            </div>
            <DiagnosticEmailForm />
        </div>
    );
}

const useStyles = tss.create(() => ({
    container: {
        marginTop: fr.spacing("4v"),
        border: `1px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
    },
    tileTitle: {
        borderRight: `1px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
        background: fr.colors.decisions.background.alt.blueFrance.default,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: fr.spacing("4v"),
        h4: {
            margin: 0,
        },
    },
    tileContent: {
        padding: fr.spacing("4v"),
        marginTop: fr.spacing("2v"),
        p: {
            margin: `0 0 0 ${fr.spacing("1v")} `,
        },
    }
}));
