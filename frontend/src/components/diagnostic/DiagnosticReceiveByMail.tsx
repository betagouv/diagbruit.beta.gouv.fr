import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Notice from "@codegouvfr/react-dsfr/Notice";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";
import { trackMatomoEvent } from "../../utils/matomo";
import { CheckTexts } from "../utils/CheckTexts";
import DiagnosticEmailForm, { modal } from "./DiagnosticEmailForm";

const MODAL_DISMISSED_COOKIE = "diagbruit_modal_dismissed";

function setModalDismissedCookie() {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${MODAL_DISMISSED_COOKIE}=1; expires=${expires}; path=/; SameSite=Lax`;
}

function isModalDismissed(): boolean {
    return document.cookie
        .split("; ")
        .some((c) => c.startsWith(`${MODAL_DISMISSED_COOKIE}=`));
}

export default function DiagnosticReceiveByMail() {
    const { cx, classes } = useStyles();
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (isModalDismissed()) return;
        const timer = setTimeout(() => {
            trackMatomoEvent("Action", "Open Email Modal", "Auto");
            modal.open();
        }, 5000);
        return () => clearTimeout(timer);
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
                        trackMatomoEvent("Action", "Open Email Modal", "Manual");
                        modal.open();
                    }}
                    className={fr.cx("fr-mt-4v")}
                >
                    Recevoir le diagnostic
                </Button>
            </div>
            <DiagnosticEmailForm
                onSuccess={() => {
                    setModalDismissedCookie();
                    setShowSuccess(true);
                    setTimeout(() => setShowSuccess(false), 5000);
                }}
                onClose={() => {
                    setModalDismissedCookie();
                }}
            />
            {showSuccess && (
                <Notice
                    severity="info"
                    title="Votre diagnostic a été envoyé par email avec succès"
                    isClosable
                    onClose={() => setShowSuccess(false)}
                    className={classes.successNotice}
                />
            )}
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
    },
    checkIcon: {
        color: fr.colors.decisions.background.flat.blueFrance.default,
    },
    successNotice: {
        position: "fixed" as const,
        bottom: fr.spacing("4v"),
        left: fr.spacing("4v"),
        zIndex: 1000,
    },
}));
