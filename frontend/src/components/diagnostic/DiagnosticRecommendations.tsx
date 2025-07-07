import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Tag from "@codegouvfr/react-dsfr/Tag";
import axios from "axios";
import { useEffect, useState } from "react";
import { tss } from "tss-react/dsfr";
import { getIsolation } from "../../utils/isolation";
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
import DiagnosticInfrastructureNoiseTable from "./DiagnosticInfrastructureNoiseTable";
import DiagnosticParcelleSvg from "./DiagnosticParcelleSvg";
import DiagnosticParcelleSvgNotice from "./DiagnosticParcelleSvgNotice";
import Notice from "@codegouvfr/react-dsfr/Notice";

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
      flags: { isMultiExposedSources },
    },
    parcelle: { geometry },
  } = diagnosticItem;

  const max_isolation = getMaxIsolationFromSoundClassificationAffectedHelper(
    optimalZoneSoundClassificationHelper
  );
  const utilFlags = getRecommendationsUtilFlags(diagnosticItem, max_isolation);
  const computedCommonRecommendations = recommendations.filter(
    (recommendation) => !recommendation.isolation
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
          ? getIsolation(intersection.sound_category, preciseDistance)
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
            max_isolation
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
      !utilFlags.isAffectedByNoisemapIntersections ||
      !utilFlags.isMonoExposed
    )
      return;

    if (
      !utilFlags.isAffectedBySoundclassificationIntersections &&
      !utilFlags.isAffectedByAirIntersections
    ) {
      return (
        <div className={cx(classes.section)}>
          <div className={fr.cx("fr-mb-6v")}>
            Cette parcelle a été cartographiée par l’agglomération, qui
            cartographie l’ensemble des infrastructures de transport. Cependant,
            elle n’est pas soumise au classement sonore (route de plus de 5000
            veh / j ; voie ferrées de plus de 50 trains / j). Le niveau minimal
            d’isolation vis-à-vis de l’extérieur est de 30 dB (arrêté 30 juin
            1999)
          </div>
          {displayAccordionRecommendations(computedSpecificRecommendations)}
        </div>
      );
    }

    if (utilFlags.isAffectedByAirIntersections) {
      return (
        <div className={cx(classes.section)}>
          <div className={fr.cx("fr-mb-4v")}>
            <Badge severity="info">Work in progress</Badge>
          </div>
          En plus des cartes de bruit stratégiques, cette parcelle est soumise
          au plan d'exposition au bruit aérien. Nos préconisations d'isolations
          liée à la combinaison des bruits aériens et terrestre sont en cours de
          rédaction.
        </div>
      );
    }

    if (!utilFlags.isSoundclassificationStillApplied) {
      return (
        <div className={cx(classes.section)}>
          <div className={fr.cx("fr-mb-6v")}>
            La zone idéale de position du bâti déterminée par diagBruit n’est
            pas Soumise au classement sonore. Attention ! Comme expliqué plus
            haut, l’utilisation des cartes de bruit est pour déterminer la zone
            idéale est abusive et ne vise qu’à alerter le porteur de projet.
            Sans classement sonore, le niveau minimal d’isolation vis-à-vis de
            l’extérieur est de 30 dB (arrêté 30 juin 1999)
          </div>
          {displayAccordionRecommendations(computedSpecificRecommendations)}
        </div>
      );
    }

    return (
      <div>
        <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
          Isolement théorique avec la zone idéale du bâti selon diagBruit
        </h4>
        <div className={cx(classes.section)}>
          <p>
            Attention ! L’isolement proposé ici est simplement informatif. Il
            vise à fournir une démonstration par l’exemple du processus de
            détermination des objectifs, techniques et matériaux d’isolation
            possibles. Le calcul définitif devra avant tout se baser sur la
            position, les dimensions et le contexte (autres bâtiments,
            protections acoustiques) réel du projet.
          </p>
          <p className={fr.cx("fr-hint-text")}>
            La distance traduit l'écart minimale entre la source de bruit et la
            zone idéale (i.e. l'isolement maximale à mettre en oeuvre)
          </p>
          <DiagnosticInfrastructureNoiseTable
            intersectionsHelper={optimalZoneSoundClassificationHelper}
            color={fr.colors.decisions.border.default.purpleGlycine.default}
          />

          {!!computedSpecificRecommendations.length && (
            <div className={fr.cx("fr-mt-10v", "fr-mb-4v")}>
              <h5
                className={cx(
                  classes.subtitle,
                  fr.cx("fr-text--md", "fr-mb-4v")
                )}
              >
                Documentation d'isolation associée
              </h5>
              {displayAccordionRecommendations(computedSpecificRecommendations)}
            </div>
          )}
        </div>
      </div>
    );
  };

  const displayComputedRecommendation = () => {
    if (!utilFlags.isMonoExposed) {
      return (
        <div className={cx(classes.section)}>
          Actuellement, le service diagBruit ne détermine une zone idéale de
          position du bâti que pour les parcelles présentant une exposition à
          une source sonore unique. Cette condition n'étant pas remplie ici, la
          parcelle ne peut en bénéficier.
        </div>
      );
    }

    if (!utilFlags.isAffectedByNoisemapIntersections) {
      if (!utilFlags.isAffectedByAirIntersections) {
        return (
          <div className={cx(classes.section)}>
            Cette parcelle n’est impactée ni par les cartes de bruit
            stratégique, ni par le plan d’exposition au bruit. DiagBruit ne peut
            fournir de position idéale et de préconisation d’isolement, mais
            rappel que le niveau minimal d’isolation vis-à-vis de l’extérieur
            est de 30 dB (arrêté 30 juin 1999)
          </div>
        );
      }

      if (!utilFlags.isAffectedBySeveralAirIntersections) {
        return (
          <div className={cx(classes.section)}>
            Le calcul de la zone idéale de construction selon diagBruit repose
            actuellement sur les cartes de bruit route et fer (plus d’info ici).
            Cette parcelle est impactée par une zone d’un Plan d’Exposition au
            Bruit. diagBruit ne préconise pas de position préférentielle pour le
            moment. Se référer à la documentation pour des exemples de calcul
            d’isolement
          </div>
        );
      } else {
        return (
          <div className={cx(classes.section)}>
            Le calcul de la zone idéale de construction selon diagBruit repose
            actuellement sur les cartes de bruit route et fer (plus d’info ici).
            Cette parcelle est impactée par plusieurs zones d’un Plan
            d’Exposition au Bruit. diagBruit ne préconise pas de position
            préférentielle pour le moment, mais utilisera dans le futur la zone
            présentant le risque le plus élevé comme référence. Se référer à la
            documentation pour des exemples de calcul d’isolement et prévoir une
            étude acoustique spécifique.
          </div>
        );
      }
    }

    return (
      <div>
        <div className={cx(classes.section)}>
          <p className={fr.cx("fr-mb-0")}>
            Attention ! La zone idéale est issue des cartes de bruit
            stratégique, dont l’objectif n’est pas de prévoir le bruit à
            l’échelle d’un bâtiment, mais plutôt d’une zone de quelques km².
            L’utilisation de ces cartes pour un objectif aussi précis n’est pas
            réaliste, et vise principalement à alerter le porteur de projet en
            lui fournissant un exemple.
          </p>
        </div>
        <div
          className={fr.cx("fr-grid-row", "fr-grid-row--gutters", "fr-my-10v")}
        >
          <div className={fr.cx("fr-col-lg-7")}>
            <div className={cx(classes.svgContainer)}>
              <DiagnosticParcelleSvg
                geometry={geometry}
                intersections={land_intersections_ld}
                onOptimalUtilsLoaded={(...props) => {
                  setOptimalZoneSoundClassificationHelper(
                    computeSoundClassificationHelpers(...props)
                  );
                }}
              />
            </div>
          </div>
          <div className={cx(classes.notice, fr.cx("fr-col-lg-5"))}>
            <DiagnosticParcelleSvgNotice
              intersections={land_intersections_ld}
            />
          </div>
        </div>
      </div>
    );
  };

  const displayAccordionRecommendations = (
    tmpRecommendations: Recommendation[]
  ) => {
    return tmpRecommendations.map((recommendation, index) => (
      <Accordion key={index} label={recommendation.title} titleAs="h5">
        {recommendation.categories.map((category) => (
          <Tag key={category.title} className={fr.cx("fr-mb-4v", "fr-mr-2v")}>
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
    ));
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
        <div className={fr.cx("fr-mb-10v")}>
          <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
            Proposition d'une zone de bâti
          </h4>
          {displayComputedRecommendation()}
          {displayIsolationInformations()}
        </div>
        <div>
          <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
            Documentation complémentaire
          </h4>
          <div className={cx(classes.section)}>
            <p className={fr.cx("fr-mb-0")}>
              Cette médiathèque de préconisations est filtrée en fonction du
              contexte spécifique de la parcelle, et ce filtrage sera
              progressivement enrichi et optimisé au fil du temps.
            </p>
            {!!computedCommonRecommendations.length && (
              <div
                className={cx(
                  classes.accordions,
                  fr.cx("fr-accordions-group", "fr-mt-6v")
                )}
              >
                {displayAccordionRecommendations(computedCommonRecommendations)}
              </div>
            )}
          </div>
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
