import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Tag from "@codegouvfr/react-dsfr/Tag";
import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { tss } from "tss-react/dsfr";
import { getIsolation } from "../../utils/isolation";
import {
  doesOptimalZoneIntersect,
  getMinDistanceToSourcePoint,
  getRecommendationsFilterConditionsFromDiagnostic,
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

type DiagnosticRecommendationsProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticRecommendations = ({
  diagnosticItem,
}: DiagnosticRecommendationsProps) => {
  const { cx, classes } = useStyles();
  const [searchParams] = useSearchParams();
  const devMode = searchParams.get("dev") === "true";

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

      return {
        intersection,
        doesAffectOptimalZone: doesOptimalZoneIntersect(
          optimalZonePoints,
          intersection.geometry_intersection,
          projectPoint
        ),
        preciseDistance,
        isolation: getIsolation(intersection.sound_category, preciseDistance),
      };
    });
  };

  useEffect(() => {
    const max_isolation = !!optimalZoneSoundClassificationHelper.length
      ? Math.max(
          ...optimalZoneSoundClassificationHelper.map(
            (helper) => helper.isolation
          )
        )
      : 0;

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

  const displayComputedRecommendation = () => {
    if (isMultiExposedSources) {
      return (
        <div className={cx(classes.section)}>
          Le service diagBruit détermine une zone idéale de position du bâti
          exclusivement pour les parcelles présentant une exposition unique à
          une source sonore. Cette condition n'étant pas remplie ici, la
          parcelle ne peut en bénéficier.
        </div>
      );
    }

    return (
      <div>
        <div className={cx(classes.section)}>
          <p className={fr.cx("fr-mb-0")}>
            D'après les cartes de bruit “Grandes Insfratructures de Transport
            Terrestres” et “Grandes Agglomérations”, voici une estimation de
            l'impact du bruit sur la surface de la parcelle :
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
        {!!soundclassification_intersections.length && (
          <div>
            <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
              Isolement
              {soundclassification_intersections.length > 1 ? "s" : ""}{" "}
              théorique
              {soundclassification_intersections.length > 1 ? "s" : ""} avec la
              zone idéale du bâti selon diagBruit
            </h4>
            <div className={cx(classes.section)}>
              <p className={fr.cx("fr-hint-text")}>
                La distance traduit l'écart minimale entre la source de bruit et
                la zone idéale (i.e. l'isolement maximale à mettre en oeuvre)
              </p>
              <DiagnosticInfrastructureNoiseTable
                intersectionsHelper={optimalZoneSoundClassificationHelper}
                color={fr.colors.decisions.border.default.purpleGlycine.default}
              />
            </div>
            <div className={fr.cx("fr-my-10v")}>
              <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
                Documentation d'isolation avec cette zone de bâti
              </h4>
              {displayAccordionRecommendations(
                recommendations.filter(
                  (recommendation) => !!recommendation.isolation
                )
              )}
            </div>
          </div>
        )}
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
      <div className={cx(classes.container)}>
        {devMode && (
          <div className={fr.cx("fr-mb-10v")}>
            <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
              Proposition d'une zone de bâti
            </h4>
            {displayComputedRecommendation()}
          </div>
        )}
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
          </div>
        </div>
        <div
          className={cx(
            classes.accordions,
            fr.cx("fr-accordions-group", "fr-mt-6v")
          )}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              marginTop: "-2rem",
            }}
          >
            <Badge className={fr.cx("fr-mb-2v")} severity="info">
              Work in progress
            </Badge>
          </div>
          {displayAccordionRecommendations(
            recommendations.filter(
              (recommendation) => !recommendation.isolation
            )
          )}
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
}));

export default DiagnosticRecommendations;
