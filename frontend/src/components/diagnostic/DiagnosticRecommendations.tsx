import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { tss } from "tss-react/dsfr";
import { getRecommendationsUtilFlags } from "../../utils/tools";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticPosition from "./DiagnosticPosition";
import Alert from "@codegouvfr/react-dsfr/Alert";

type DiagnosticRecommendationsProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticRecommendations = ({
  diagnosticItem,
}: DiagnosticRecommendationsProps) => {
  const { cx, classes } = useStyles();

  const utilFlags = getRecommendationsUtilFlags(diagnosticItem);

  const displayComputedRecommendation = () => {
    if (
      !utilFlags.isAffectedByNoisemapIntersections &&
      !utilFlags.isAffectedByAirIntersections
    ) {
      return (
        <p className={fr.cx("fr-mb-0")}>
          Cette parcelle n’est pas impactée par les cartes de bruit
          stratégiques. DiagBruit ne peut fournir de position idéale et de
          préconisation d’isolement.
        </p>
      );
    }

    return (
      <div>
        <p className={fr.cx("fr-mb-2v")}>
          Nous vous recommandons de <strong>positionner</strong> votre bâtiment
          résidentiel <strong>dans la zone idéale</strong> identifiée par
          diagbruit.
        </p>
        <p className={fr.cx("fr-mb-0")}>
          Ce diagnostic s'appuie sur les cartes de bruit réglementaires. Pour
          affiner ces résultats et obtenir des mesures acoustiques précises,
          consultez un acousticien certifié ou un bureau d'études spécialisé
          avant le dépôt de permis.
        </p>
        <div className={fr.cx("fr-my-10v")}>
          <DiagnosticPosition diagnosticItem={diagnosticItem} />
          {utilFlags.isAffectedByAirIntersections && (
            <Alert
              severity="warning"
              title="Parcelle exposée au bruit aérien"
              description="L'implantation dans la zone idéale réduit l'exposition aux
                    bruits des routes et voie ferrées, mais ne protège pas du
                    bruit aérien (avions, hélicoptères). Prévoyez une isolation
                    acoustique adaptée sur l'ensemble du bâtiment (toiture et
                    façade)."
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
        }}
      >
        <Badge severity="info">Work in progress</Badge>
      </div>
      <div className={cx(classes.container)}>
        <div>
          <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-10v")}>
            Implantation du bâti : privilégiez la zone à faible exposition
            sonore
          </h4>
          {displayComputedRecommendation()}
        </div>
      </div>
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    flexGrow: 1,
    [fr.breakpoints.down("md")]: {
      paddingTop: fr.spacing("2v"),
    },
    ".fr-notice__body": {
      ".fr-notice__desc": {
        ...fr.typography[17].style,
      },
      button: {
        display: "none",
      },
    },
  },
  mainIcon: {
    padding: fr.spacing("1v"),
  },
  section: {
    padding: `${fr.spacing("2v")} ${fr.spacing("2v")} ${fr.spacing(
      "2v",
    )} ${fr.spacing("10v")}`,
    marginLeft: fr.spacing("6v"),
    borderLeft: `4px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
  },
  accordions: {
    width: "100%",
  },
  links: {
    backgroundColor: fr.colors.decisions.background.default.grey.active,
    padding: fr.spacing("4v"),
    marginTop: fr.spacing("8v"),
    ul: {
      marginLeft: fr.spacing("4v"),
    },
  },
  recommendationContent: {
    img: {
      height: "auto",
      aspectRatio: "auto",
    },
  },
  subtitle: {
    textDecoration: "underline",
  },
  noticeContent: {
    display: "block",
    paddingLeft: "2.3rem",
  },
}));

export default DiagnosticRecommendations;
