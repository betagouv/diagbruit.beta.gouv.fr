import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";

export const modal = createModal({
  id: "diagnostic-receive-by-mail-modal",
  isOpenedByDefault: false,
});

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const submitAlertMessages: Record<
  "success" | "error" | "rate-limit",
  { severity: "success" | "error"; title: string; description: string }
> = {
  success: {
    severity: "success",
    title: "Email enregistré avec succès",
    description: "Vous recevrez votre diagnostic par email prochainement.",
  },
  "rate-limit": {
    severity: "error",
    title: "Trop de demandes",
    description:
      "Vous avez effectué trop de demandes. Veuillez patienter quelques instants avant de réessayer.",
  },
  error: {
    severity: "error",
    title: "Une erreur est survenue",
    description: "Impossible d'enregistrer votre email. Veuillez réessayer.",
  },
};

const selectOptions = [
  { value: "architecte", label: "Architecte" },
  { value: "charge-de-mission-bruit", label: "Chargé de mission bruit" },
  { value: "instructeur", label: "Instructeur ADS" },
  { value: "particulier", label: "Particulier" },
  { value: "promoteur", label: "Promoteur" },
  { value: "service-amenagement", label: "Service aménagement" },
  { value: "autre", label: "Autre" },
];

export default function DiagnosticEmailForm({
  onSuccess,
  onClose,
}: {
  onSuccess?: () => void;
  onClose?: () => void;
}) {
  const { cx, classes } = useStyles();

  useEffect(() => {
    const modalElement = document.getElementById(modal.id);
    if (!modalElement) return;
    const handleConceal = () => onClose?.();
    modalElement.addEventListener("dsfr.conceal", handleConceal);
    return () => modalElement.removeEventListener("dsfr.conceal", handleConceal);
  }, [onClose]);

  const [value, setValue] = useState("");
  const [email, setEmail] = useState("");
  const [profileError, setProfileError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "success" | "error" | "rate-limit" | null
  >(null);

  const submitEmail = async () => {
    const subscribeResponse = await fetch(
      `${process.env.REACT_APP_CMS_URL}/api/email/subscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, profile: value }),
      },
    );
    if (!subscribeResponse.ok) {
      if (subscribeResponse.status === 429) {
        throw new Error("rate-limit");
      }
      throw new Error(
        `Erreur lors de l'enregistrement : ${subscribeResponse.status}`,
      );
    }

    const mailResponse = await fetch(
      `${process.env.REACT_APP_CMS_URL}/api/email/send`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, link: window.location.href }),
      },
    );
    if (!mailResponse.ok) {
      if (mailResponse.status === 429) {
        throw new Error("rate-limit");
      }
      throw new Error(
        `Erreur lors de l'envoi de l'email : ${mailResponse.status}`,
      );
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const hasProfileError = !value;
    const hasEmailError = !email || !isValidEmail(email);
    setProfileError(hasProfileError);
    setEmailError(hasEmailError);
    if (hasProfileError || hasEmailError) return;

    setIsSubmitting(true);
    setSubmitStatus(null);
    submitEmail()
      .then(() => {
        modal.close();
        onSuccess?.();
      })
      .catch((err) => {
        console.error(err);
        setSubmitStatus(err.message === "rate-limit" ? "rate-limit" : "error");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const CheckText = ({ text }: { text: string }) => (
    <>
      <i className={cx(classes.checkIcon, "ri-check-line")} />
      <p>{text}</p>
    </>
  );

  const textContent = (
    <>
      <div className={cx("fr-grid-row")}>
        <CheckText text="Retrouver facilement les réglementations en vigueurs" />
      </div>
      <div className={cx("fr-grid-row")}>
        <CheckText text="Partagez rapidement l'anlyse avec vos interlocuteurs" />
      </div>
      <div className={cx("fr-grid-row")}>
        <CheckText text="Accédez aux préconisations à tout moment" />
      </div>
    </>
  );

  return (
    <modal.Component title="Recevoir mon diagnostic par email" size="large">
      {submitStatus && (
        <Alert
          closable
          {...submitAlertMessages[submitStatus]}
          onClose={() => setSubmitStatus(null)}
          className={fr.cx("fr-mb-4v")}
        />
      )}
      <div className={cx(classes.container, "fr-grid-row")}>
        <div className={cx(classes.tileTitle, "fr-col-2")}>
          <img src="/images/document-download.svg" alt="" />
        </div>
        <div className={cx(classes.tileContent, "fr-col-10")}>
          {textContent}
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={classes.formInputContainer}>
          <Select
            label="Mon Profil"
            state={profileError ? "error" : "default"}
            stateRelatedMessage={
              profileError ? "Veuillez sélectionner un profil" : undefined
            }
            nativeSelectProps={{
              onChange: (event) => {
                setValue(event.target.value);
                setProfileError(false);
              },
              value,
            }}
          >
            <option value="" disabled hidden>
              Selectionnez un profil
            </option>
            {selectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Input
            label="Adresse email"
            state={emailError ? "error" : "info"}
            stateRelatedMessage={
              emailError ? (
                !email ? (
                  "Veuillez saisir une adresse email"
                ) : (
                  "Veuillez saisir une adresse email valide"
                )
              ) : (
                <span>
                  {
                    "Votre adresse email sera utilisée uniquement pour vous transmettre votre diagnostic et vous accompagner avec des conseils adaptés à votre projet. "
                  }
                  <a href="/privacy-policy">Voir nos engagements</a>
                </span>
              )
            }
            nativeInputProps={{
              value: email,
              onChange: (event) => {
                setEmail(event.target.value);
                setEmailError(false);
              },
            }}
          />
        </div>
        <div className={classes.actions}>
          <Button
            type="submit"
            priority="primary"
            iconId="ri-check-line"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Envoi en cours..." : "Valider"}
          </Button>
        </div>
      </form>
    </modal.Component>
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
  formInputContainer: {
    marginTop: fr.spacing("4v"),
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: fr.spacing("3v"),
  },
}));
