import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { tss } from "tss-react/dsfr";
import DocumentDownload from "@codegouvfr/react-dsfr/picto/DocumentDownload";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Input from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { useEffect, useState } from "react";

const modal = createModal({
    id: "diagnostic-receive-by-mail-modal",
    isOpenedByDefault: true,
});

export default function DiagnosticReceiveByMail() {

    const { cx, classes } = useStyles();

    const [value, setValue] = useState("");
    const [email, setEmail] = useState("");
    const [profileError, setProfileError] = useState(false);
    const [emailError, setEmailError] = useState(false);

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleValidate = () => {
        const hasProfileError = !value;
        const hasEmailError = !email || !isValidEmail(email);
        setProfileError(hasProfileError);
        setEmailError(hasEmailError);
        if (!hasProfileError && !hasEmailError) {
            modal.close();
        }
    };

    const CheckText = ({
        text,
    }: {
        text: string;
    }) => {
        return (
            <>
                <i className={cx(classes.checkIcon, "ri-check-line")}></i><p>{text}</p>
            </>
        )
    }

    const textContent = () => {
        return (
            <>
                <div className={cx("fr-grid-row")}>
                    <CheckText text="Retrouver facilement les réglementations en vigueurs" />
                </div>
                <div className={cx("fr-grid-row")}>
                    <CheckText text="Partagez rapidement l’anlyse avec vos interlocuteurs" />

                </div>
                <div className={cx("fr-grid-row")}>
                    <CheckText text="Accédez aux préconisations à tout moment" />
                </div>
            </>
        )
    }

    useEffect(() => {
        setTimeout(() => {
            modal.open();
        }, 5000);
    }, [])

    return (
        <>
            <div className={cx(classes.container, "fr-grid-row")}>
                <div className={cx(classes.tileTitle, "fr-col-4")}>
                    <DocumentDownload />
                    <h4 className={fr.cx("fr-h6")}>Recevoir mon diagnostic par email</h4>
                </div>
                <div className={cx(classes.tileContent, "fr-col-8")}>
                    {textContent()}
                    <Button
                        priority="primary"
                        iconId="ri-mail-line"
                        onClick={() => { modal.open() }}
                        className={fr.cx("fr-mt-4v")}
                    >
                        Recevoir mon diagnostic
                    </Button>
                </div>
                <modal.Component title="Recevoir mon diagnostic par email" size="large">
                    <div className={cx(classes.container, "fr-grid-row")}>
                        <div className={cx(classes.tileTitle, "fr-col-1")}>
                            <DocumentDownload />
                        </div>
                        <div className={cx(classes.tileContent, "fr-col-11")}>
                            {textContent()}
                        </div>
                    </div>
                    <Select
                        label="Mon Profil"
                        state={profileError ? "error" : "default"}
                        stateRelatedMessage={profileError ? "Veuillez sélectionner un profil" : undefined}
                        nativeSelectProps={{
                            onChange: event => { setValue(event.target.value); setProfileError(false); },
                            value
                        }}
                    >
                        <option value="" disabled hidden>Selectionnez un profil</option>
                        <option value="architecte">Architecte</option>
                        <option value="charge-de-mission-bruit">Chargé de mission bruit</option>
                        <option value="instructeur">Instructeur ADS</option>
                        <option value="particulier">Particulier</option>
                        <option value="promoteur">Promoteur</option>
                        <option value="service-amenagement">Service aménagement</option>
                        <option value="autre">Autre</option>
                    </Select>
                    <Input
                        label="Adresse email"
                        state={emailError ? "error" : "info"}
                        stateRelatedMessage={emailError ? (!email ? "Veuillez saisir une adresse email" :
                            "Veuillez saisir une adresse email valide") :
                            `Votre adresse email sera utilisée uniquement pour vous transmettre votre diagnostic
                             et vous accompagner avec des conseils adaptés à votre projet.
                             Voir nos engagements`}
                        nativeInputProps={{
                            value: email,
                            onChange: event => { setEmail(event.target.value); setEmailError(false); }
                        }}
                    />
                    <Button
                        priority="primary"
                        iconId="ri-check-line"
                        onClick={handleValidate}
                    >
                        Valider
                    </Button>
                </modal.Component>
            </div>
        </>
    );
};

const useStyles = tss.create(() => ({
    container: {
        marginBottom: fr.spacing("4v"),
        border: `1px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
    },
    tileTitle: {
        borderRight: `1px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
        background: fr.colors.decisions.background.alt.blueFrance.default,
    },
    tileContent: {
        padding: fr.spacing("4v"),
        p: {
            margin: `0 0 0 ${fr.spacing("1v")} `,
        }
    },
    checkIcon: {
        color: fr.colors.decisions.background.flat.blueFrance.default,
    }

}));