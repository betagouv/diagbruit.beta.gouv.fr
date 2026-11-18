import { fr } from "@codegouvfr/react-dsfr";
import type { DiagnosticItem } from "../../../utils/types";
import { useGoToTab } from "../../../hooks/useGoToTab";
import { tss } from "tss-react/dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";

type RegulationIsolationProps = {
  diagnosticItem: DiagnosticItem;
};

const RegulationIsolation = ({ diagnosticItem }: RegulationIsolationProps) => {
  const { diagnostic } = diagnosticItem;
  const { cx, classes } = useStyles();
  const goToTab = useGoToTab();

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
    <div className={fr.cx("fr-p-2v")}>
      <div className={classes.isolationContent}>
        <h4 className={classes.isolationTitle}>
          1. La parcelle est-elle concernée par une obligation d’isolation ?
        </h4>
        <p className={classes.isolationText}>
          <strong>Oui</strong>, toutes les parcelles sont concernées par une <strong>obligation d'isolation minimale de 30 dB</strong> afin de garantir la conformité réglementaire.
        </p>
        <h4 className={classes.isolationTitle}>
          2. Quelles sont les particularités de la parcelle sélectionnée ?
        </h4>
        <p className={classes.isolationText}>
          La parcelle sélectionnée est située dans une zone <strong>soumise au classement sonore ou au Plan d’Exposition au Bruit. </strong>
          L’isolation préconisée sera potentiellement supérieure au seuil d'isolation minimale réglementaire de 30 dB.
        </p>
        <h4 className={classes.isolationTitle}>
          3. Quel est le niveau d’isolation requis pour la parcelle sélectionnée ?
        </h4>
      </div>
      {hasIsolation ? (
        diagnostic.isolation_min !== diagnostic.isolation_max ? (
          <>
            <Badge severity="info" className={fr.cx("fr-my-2v")}>Préconisations diagBruit</Badge>
            <p className={classes.isolationText}>
              L’outil diagBruit propose, <strong>à titre indicatif,</strong> une fourchette d’isolation minimale située entre <strong>{diagnostic.isolation_min} dB et {diagnostic.isolation_max} dB. </strong>
              Cette préconisation <strong>ne se substitue, en aucun cas, à une étude acoustique.</strong>
            </p>
          </>
        ) : (
          <p className={fr.cx("fr-text--lg", "fr-mb-2v")}>
            {exposureText}, vous avez une obligation d'isolation réglementaire
            de <strong>{diagnostic.isolation_max} dB</strong>.
          </p>

        )
      ) : (
        <p className={fr.cx("fr-text--lg", "fr-mb-4v")}>
          Votre parcelle n'est pas soumise à une isolation réglementaire.
          L'isolation acoustique minimale de <strong>30 dB</strong> est
          obligatoire selon la réglementation en vigueur.
        </p>
      )}

      <div className={classes.isolationContent}>
        <h4 className={classes.isolationTitle}>
          4. Comment la fourchette d’isolation diagBruit est-elle calculée ?
        </h4>
        <Badge severity="error">Calcul</Badge>
        <p className={classes.isolationText}>
          Le <strong>calcul d'isolation</strong>sur la parcelle sélectionnée <strong>dépend de plusieurs facteurs</strong> : distance, masquage par des bâtiments existants, protections phonique existantes, multi exposition.
        </p>

        <h4 className={classes.isolationTitle}>
          5. Comment mettre en œuvre une isolation adaptée à la parcelle sélectionnée ?
        </h4>
        <Badge className={fr.cx("fr-badge--yellow-moutarde")}>
          <span className={fr.cx("fr-icon-todo-fill", "fr-icon--sm", "fr-mr-1v")} aria-hidden="true" />
          Actions
        </Badge>
        <ul className={classes.actionsList}>
          <li>
            <strong>Faites appel à un acousticien certifié ou à un bureau d'études spécialisé</strong>{" "}
            avant le dépôt du permis de construire pour garantir la conformité réglementaire de votre
            projet et protéger la santé et le confort de vos futurs résidents.
            <br />
            <a href="/preco/bureau-etudes-acoustiques" className={cx(classes.link)}>
              Consultez les annuaires de bureaux d'études acoustiques
              <i className={fr.cx("ri-arrow-right-line", "fr-pl-1v")} />
            </a>
          </li>
          <li>
            <strong>Déplacez-vous :</strong> une visite sur le terrain permet d'évaluer partiellement
            l'environnement sonore.
          </li>
          <li>
            <strong>Consultez les ressources diagBruit</strong> spécifiques à la thématique isolation :
          </li>
        </ul>
      </div>
      {/* <FakeLinkComponent onClick={() => goToTab("legal")}>
        Voir le détail du classement sonore{" "}
        <i className={fr.cx("ri-arrow-right-line")} />
      </FakeLinkComponent>
      <FakeLinkComponent onClick={() => goToTab("position")}>
        Voir la répartition sonore sur la parcelle{" "}
        <i className={fr.cx("ri-arrow-right-line")} />
      </FakeLinkComponent> */}

    </div>
  );
};


export default RegulationIsolation;

const useStyles = tss.create(() => ({
  isolationContent: {
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("4v"),
  },

  isolationTitle: {
    fontSize: "1.125rem",
    lineHeight: "1.75rem",
    marginTop: 0,
    marginBottom: 0,
  },
  isolationText: {
    fontSize: "1.125rem",
    lineHeight: "1.75rem",
    marginTop: 0,
    marginBottom: fr.spacing("4v"),
  },
  actionsList: {
    fontSize: "1.125rem",
    lineHeight: "1.75rem",
    margin: 0,
    "& > li": {
      paddingBottom: 0,
    },
    "& > li + li": {
      marginTop: fr.spacing("4v"),
    },
  },
  link: {
    color: fr.colors.decisions.text.actionHigh.blueFrance.default,
    "i::before": {
      "--icon-size": fr.typography[19].style.fontSize,
    },
  }
}));
