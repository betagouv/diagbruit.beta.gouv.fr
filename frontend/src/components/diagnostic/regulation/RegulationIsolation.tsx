import { fr } from "@codegouvfr/react-dsfr";
import { useSearchParams } from "react-router-dom";
import type { DiagnosticItem } from "../../../utils/types";
import FakeLinkComponent from "../../ui/FakeLinkComponent";

type RegulationIsolationProps = {
  diagnosticItem: DiagnosticItem;
};

const RegulationIsolation = ({ diagnosticItem }: RegulationIsolationProps) => {
  const { diagnostic } = diagnosticItem;
  const [, setSearchParams] = useSearchParams();

  const goToTab = (str: string) => {
    const next = new URLSearchParams(window.location.search);
    next.set("tab", str);
    setSearchParams(next);
  };

  const hasIsolation =
    diagnostic.isolation_max && diagnostic.isolation_max > 30;

  const hasPeb = diagnostic.air_intersections.length > 0;
  const hasCls = diagnostic.soundclassification_intersections.length > 0;
  const exposureText =
    hasPeb && hasCls
      ? "Vous êtes soumis au bruit aérien et au classement sonore"
      : hasPeb
        ? "Vous êtes soumis au bruit aérien"
        : "Vous êtes soumis au classement sonore";

  return (
    <>
      {hasIsolation ? (
        diagnostic.isolation_min !== diagnostic.isolation_max ? (
          <p className={fr.cx("fr-text--lg", "fr-mb-2v")}>
            {exposureText}, vous avez une obligation d'isolation réglementaire
            entre{" "}
            <strong>
              {diagnostic.isolation_min} et {diagnostic.isolation_max} dB
            </strong>{" "}
            selon la position du bati.
          </p>
        ) : (
          <p className={fr.cx("fr-text--lg", "fr-mb-2v")}>
            {exposureText}, vous avez une obligation d'isolation réglementaire
            de <strong>{diagnostic.isolation_max} dB</strong>.
          </p>
        )
      ) : (
        <p className={fr.cx("fr-text--lg", "fr-mb-2v")}>
          Votre parcelle n'est pas soumise à une isolation réglementaire.
          L'isolation acoustique minimale de <strong>30 dB</strong> est
          obligatoire selon la réglementation en vigueur.
        </p>
      )}

      <FakeLinkComponent onClick={() => goToTab("legal")}>
        Voir le détail du classement sonore{" "}
        <i className={fr.cx("ri-arrow-right-line")} />
      </FakeLinkComponent>
      <FakeLinkComponent onClick={() => goToTab("position")}>
        Voir la répartition sonore sur la parcelle{" "}
        <i className={fr.cx("ri-arrow-right-line")} />
      </FakeLinkComponent>
    </>
  );
};


export default RegulationIsolation;
