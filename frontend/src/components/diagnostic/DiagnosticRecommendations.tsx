import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { tss } from "tss-react/dsfr";
import { getRecommendationsUtilFlags } from "../../utils/tools";
import { DiagnosticItem } from "../../utils/types";
import DiagnosticPosition from "./DiagnosticPosition";

type DiagnosticRecommendationsProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticRecommendations = ({
  diagnosticItem,
}: DiagnosticRecommendationsProps) => {
  const { cx, classes } = useStyles();

  const utilFlags = getRecommendationsUtilFlags(diagnosticItem);

  const displayComputedRecommendation = () => {
    if (!utilFlags.isMonoExposed) {
      return (
        <p className={fr.cx("fr-mb-0")}>
          Actuellement, le service diagBruit ne détermine une zone idéale de
          position du bâti que pour les parcelles ne présentant pas d'exposition
          à une source sonore aérienne. Cette condition n'étant pas remplie ici,
          la parcelle ne peut en bénéficier.
        </p>
      );
    }

    if (!utilFlags.isAffectedByNoisemapIntersections) {
      if (!utilFlags.isAffectedByAirIntersections) {
        return (
          <p className={fr.cx("fr-mb-0")}>
            Cette parcelle n’est pas impactée par les cartes de bruit
            stratégiques. DiagBruit ne peut fournir de position idéale et de
            préconisation d’isolement.
          </p>
        );
      }

      if (!utilFlags.isAffectedBySeveralAirIntersections) {
        return (
          <p className={fr.cx("fr-mb-0")}>
            Le calcul de la zone idéale de construction selon diagBruit repose
            actuellement sur les cartes de bruit route et fer. Cette parcelle
            est impactée par une zone d’un Plan d’Exposition au Bruit. diagBruit
            ne préconise pas de position préférentielle pour le moment.
          </p>
        );
      } else {
        return (
          <p className={fr.cx("fr-mb-0")}>
            Le calcul de la zone idéale de construction selon diagBruit repose
            actuellement sur les cartes de bruit route et fer. Cette parcelle
            est impactée par plusieurs zones d’un Plan d’Exposition au Bruit.
            diagBruit ne préconise pas de position préférentielle pour le
            moment, mais utilisera dans le futur la zone présentant le risque le
            plus élevé comme référence. Se référer à la documentation pour des
            exemples de calcul d’isolement et prévoir une étude acoustique
            spécifique.
          </p>
        );
      }
    }

    return (
      <div>
        <p className={fr.cx("fr-mb-0")}>
          Attention ! La zone idéale est issue des cartes de bruit stratégique,
          dont l’objectif n’est pas de prévoir le bruit à l’échelle d’un
          bâtiment, mais plutôt d’une zone de quelques km². L’utilisation de ces
          cartes pour un objectif aussi précis n’est pas réaliste, et vise
          principalement à alerter le porteur de projet en lui fournissant un
          exemple.
        </p>
        <div className={fr.cx("fr-my-10v")}>
          <DiagnosticPosition diagnosticItem={diagnosticItem} />
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
            Préconisation d’une zone de bâti selon les caractéristiques de la
            parcelle
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
      "2v"
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
}));

export default DiagnosticRecommendations;
