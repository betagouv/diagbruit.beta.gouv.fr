import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Tag from "@codegouvfr/react-dsfr/Tag";
import axios from "axios";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";
import {
  getAirIsolation,
  getComputedIsolation,
  getLandIntersectionIsolation,
  getLandIsolation,
} from "../../utils/isolation";
import {
  doesOptimalZoneIntersect,
  getMaxIsolationFromSoundClassificationAffectedHelper,
  getMinDistanceToSourcePoint,
  getRecommendationsFilterConditionsFromDiagnostic,
  getRecommendationsUtilFlags,
} from "../../utils/tools";
import {
  DiagnosticItem,
  Recommendation,
  SoundClassificationIntersectionAffectedHelper,
} from "../../utils/types";
import { Loader } from "../ui/Loader";
import DiagnosticIsolationBadge from "./DiagnosticIsolationBadge";
import DiagnosticParcelleSvg from "./DiagnosticParcelleSvg";
import DiagnosticParcelleSvgNotice from "./DiagnosticParcelleSvgNotice";

type DiagnosticRecommendationsProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticRecommendations = ({
  diagnosticItem,
}: DiagnosticRecommendationsProps) => {
  const { cx, classes } = useStyles();

  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [
    optimalZoneSoundClassificationHelper,
    setOptimalZoneSoundClassificationHelper,
  ] = useState<SoundClassificationIntersectionAffectedHelper[]>([]);

  const {
    diagnostic: {
      land_intersections_ld,
      soundclassification_intersections,
      air_intersections,
      zones,
    },
    parcelle: { geometry },
  } = diagnosticItem;

  const land_optimal_isolation =
    getMaxIsolationFromSoundClassificationAffectedHelper(
      optimalZoneSoundClassificationHelper
    );

  const land_isolation = !!land_optimal_isolation
    ? land_optimal_isolation
    : getLandIsolation(soundclassification_intersections);

  const air_isolation = getAirIsolation(air_intersections);
  const computed_isolation = getComputedIsolation(
    land_isolation,
    air_isolation
  );
  const utilFlags = getRecommendationsUtilFlags(
    diagnosticItem,
    computed_isolation
  );

  const computedSpecificRecommendations = recommendations.filter(
    (recommendation) => !!recommendation.isolation
  );

  const computeSoundClassificationHelpers = (
    optimalZonePoints: { x: number; y: number }[],
    projectPoint: (point: [number, number]) => { x: number; y: number },
    unprojectPoint: ({ x, y }: { x: number; y: number }) => [number, number]
  ): SoundClassificationIntersectionAffectedHelper[] => {
    return soundclassification_intersections.map((intersection) => {
      const preciseDistance = getMinDistanceToSourcePoint(
        optimalZonePoints,
        intersection.geometry_source_point,
        unprojectPoint
      );

      const doesAffectOptimalZone = doesOptimalZoneIntersect(
        optimalZonePoints,
        intersection.geometry_intersection,
        projectPoint
      );

      return {
        intersection,
        doesAffectOptimalZone,
        preciseDistance,
        isolation: doesAffectOptimalZone
          ? getLandIntersectionIsolation(
              intersection.sound_category,
              preciseDistance
            )
          : 0,
      };
    });
  };

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_CMS_URL}/api/recommendations`, {
        params: {
          populate: "*",
          filters: getRecommendationsFilterConditionsFromDiagnostic(
            diagnosticItem,
            computed_isolation
          ),
        },
      })
      .then((res) => {
        setRecommendations(res.data.data);
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
        console.error(err);
      });
  }, [optimalZoneSoundClassificationHelper]);

  const displayIsolationInformations = () => {
    if (
      !utilFlags.isAffectedByNoisemapIntersections &&
      !utilFlags.isAffectedByAirIntersections
    ) {
      return (
        <div>
          <p>
            Cette parcelle n’est impactée ni par les cartes de bruit
            stratégique, ni par le plan d’exposition au bruit.
          </p>
          <DiagnosticIsolationBadge isolation={30} />
        </div>
      );
    }

    if (
      !utilFlags.isAffectedBySoundclassificationIntersections &&
      !utilFlags.isAffectedByAirIntersections
    ) {
      return (
        <div>
          <p>
            Cette parcelle a été cartographiée par l’agglomération, qui
            cartographie l’ensemble des infrastructures de transport. Cependant,
            elle n’est pas soumise au classement sonore (route de plus de 5000
            veh / j ; voie ferrées de plus de 50 trains / j). Le niveau minimal
            d’isolation vis-à-vis de l’extérieur est de 30 dB (arrêté 30 juin
            1999)
          </p>
          <DiagnosticIsolationBadge isolation={30} />
        </div>
      );
    }

    if (
      utilFlags.isAffectedByAirIntersections &&
      utilFlags.isAffectedBySoundclassificationIntersections
    ) {
      //TODO : DISPLAY A CUSTOM TABLE TO EXPLAIN COMPUTED ISOLATION REQUIREMENTS?
      if (utilFlags.isMonoExposed) {
        return (
          <div>
            <p>
              Attention ! L’isolement proposé ici est simplement informatif.
              Cette parcelle est soumise au classement sonore et se situe en
              zone {air_intersections[0].zone} du Plan d'Exposition au Bruit. En
              respectant la zone de bâti préconisée par diagBruit, l'isolation
              théorique est de {computed_isolation} dB.
            </p>
            <DiagnosticIsolationBadge isolation={computed_isolation} />
          </div>
        );
      } else {
        return (
          <div>
            <p>
              Cette parcelle est soumise au classement sonore et se situe en
              zone {air_intersections[0].zone} du Plan d'Exposition au Bruit,
              l'isolation théorique pour cette multi-exposition est de{" "}
              {computed_isolation} dB.
            </p>
            <DiagnosticIsolationBadge isolation={computed_isolation} />
          </div>
        );
      }
    }

    if (
      utilFlags.isAffectedByAirIntersections &&
      !utilFlags.isAffectedBySeveralSoundclassificationIntersections
    ) {
      //TODO : DISPLAY A CUSTOM TABLE TO EXPLAIN AIR ISOLATION REQUIREMENTS?
      return (
        <div>
          <p>
            Cette parcelle se situe en zone {air_intersections[0].zone} du Plan
            d'Exposition au Bruit.
          </p>
          <DiagnosticIsolationBadge isolation={air_isolation} />
        </div>
      );
    }

    if (
      utilFlags.isMonoExposed &&
      utilFlags.isAffectedByNoisemapIntersections &&
      land_optimal_isolation === 0
    ) {
      return (
        <div>
          <p>
            La zone idéale de position du bâti déterminée par diagBruit n’est
            pas Soumise au classement sonore. Attention ! Comme expliqué plus
            haut, l’utilisation des cartes de bruit est pour déterminer la zone
            idéale est abusive et ne vise qu’à alerter le porteur de projet.
            Sans classement sonore, le niveau minimal d’isolation vis-à-vis de
            l’extérieur est de 30 dB (arrêté 30 juin 1999).
          </p>
          <DiagnosticIsolationBadge isolation={30} />
        </div>
      );
    }

    return (
      <div>
        <p>
          Attention ! L’isolement proposé ici est simplement informatif. Il vise
          à fournir une démonstration par l’exemple du processus de
          détermination des objectifs, techniques et matériaux d’isolation
          possibles. Le calcul définitif devra avant tout se baser sur la
          position, les dimensions et le contexte (autres bâtiments, protections
          acoustiques) réel du projet.
        </p>
        <DiagnosticIsolationBadge isolation={land_isolation} />
      </div>
    );
  };

  const displayComputedRecommendation = () => {
    if (!utilFlags.isMonoExposed) {
      return (
        <p className={fr.cx("fr-mb-0")}>
          Actuellement, le service diagBruit ne détermine une zone idéale de
          position du bâti que pour les parcelles présentant une exposition à
          une source sonore unique. Cette condition n'étant pas remplie ici, la
          parcelle ne peut en bénéficier.
        </p>
      );
    }

    if (!utilFlags.isAffectedByNoisemapIntersections) {
      if (!utilFlags.isAffectedByAirIntersections) {
        return (
          <p className={fr.cx("fr-mb-0")}>
            Cette parcelle n’est impactée ni par les cartes de bruit
            stratégique, ni par le plan d’exposition au bruit. DiagBruit ne peut
            fournir de position idéale et de préconisation d’isolement.
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
        <div
          className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-my-10v")}
        >
          <div className={fr.cx("fr-col-lg-7")}>
            <div className={cx(classes.svgContainer)}>
              <DiagnosticParcelleSvg
                geometry={geometry}
                zones={zones}
                onOptimalUtilsLoaded={(...props) => {
                  setOptimalZoneSoundClassificationHelper(
                    computeSoundClassificationHelpers(...props)
                  );
                }}
              />
            </div>
          </div>
          <div className={cx(classes.notice, fr.cx("fr-col-lg-5"))}>
            <DiagnosticParcelleSvgNotice zones={zones} />
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={fr.cx("fr-my-12w")}>
        <Loader />
      </div>
    );
  }

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
          <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
            Suggestions d’isolement théorique
          </h4>
          {displayIsolationInformations()}
          <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
            Documentation d'isolation
          </h4>
          {computedSpecificRecommendations.map((recommendation, index) => (
            <Accordion key={index} label={recommendation.title} titleAs="h5">
              {recommendation.categories.map((category) => (
                <Tag
                  key={category.title}
                  className={fr.cx("fr-mb-4v", "fr-mr-2v")}
                >
                  {category.title}
                </Tag>
              ))}
              <div
                className={cx(classes.recommendationContent)}
                dangerouslySetInnerHTML={{ __html: recommendation.content }}
              />
              {!!recommendation.links.length && (
                <div className={cx(classes.links)}>
                  <p className={fr.cx("fr-mb-2v")}>
                    <b>Liens utiles :</b>
                  </p>
                  <ul className={fr.cx("fr-mb-0")}>
                    {recommendation.links.map((link, index) => (
                      <li key={index}>
                        <a href={link.href} target="_blank">
                          {link.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Accordion>
          ))}
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
  svgContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "400px",
  },
  notice: {
    display: "flex",
    alignItems: "center",
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
