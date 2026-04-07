import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { useEffect, useRef, useState } from "react";
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

export default function DiagnosticReceiveByMail({
  parcelNumber,
}: {
  parcelNumber?: string;
}) {
  const { cx, classes } = useStyles();
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isModalDismissed()) return;
    const el = containerRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          timer = setTimeout(() => {
            trackMatomoEvent("Action", "Open Email Modal", "Auto");
            modal.open();
          }, 2000);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={containerRef} className={cx(classes.container, "fr-grid-row")}>
      <div className={cx(classes.imgContainer, "fr-col-12", "fr-col-md-1")}>
        <img src="/images/document-download.svg" alt="" />

      </div>
      <div className={cx(classes.tileContent, "fr-col-12", "fr-col-md-6")}>
        {<CheckTexts />}
      </div>
      <div className={cx("fr-col-12", "fr-col-md-4", classes.buttonContainer)}>
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
        onSuccess={(email) => {
          setModalDismissedCookie();
          setSuccessEmail(email);
          setTimeout(() => setSuccessEmail(null), 5000);
        }}
        onClose={() => {
          setModalDismissedCookie();
        }}
        parcelNumber={parcelNumber}
      />
      {successEmail && (
        <Alert
          severity="success"
          title="Diagnostic envoyé !"
          description={`Vous avez dû recevoir un email à ${successEmail}`}
          closable
          onClose={() => setSuccessEmail(null)}
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
  imgContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: fr.spacing("4v"),

  },
  tileContent: {
    padding: `${fr.spacing("4v")} 0`,
    p: {
      margin: `0 0 0 ${fr.spacing("1v")} `,
    },
  },
  buttonContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  checkIcon: {
    color: fr.colors.decisions.background.flat.blueFrance.default,
  },
  successNotice: {
    position: "fixed" as const,
    bottom: fr.spacing("4v"),
    left: fr.spacing("4v"),
    backgroundColor: fr.colors.decisions.background.default.grey.default,
    zIndex: 1000,
  },
}));
