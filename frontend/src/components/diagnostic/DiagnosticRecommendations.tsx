import { fr } from "@codegouvfr/react-dsfr";
import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { useCallback, useEffect, useRef, useState } from "react";
import { tss } from "tss-react/dsfr";
import {
  doesOptimalZoneIntersect,
  getMinDistanceToSourcePoint,
} from "../../utils/tools";
import {
  DiagnosticItem,
  SoundClassificationIntersectionAffectedHelper,
} from "../../utils/types";
import DiagnosticInfrastructureNoiseTable from "./DiagnosticInfrastructureNoiseTable";
import DiagnosticParcelleSvg, {
  DiagnosticParcelleSvgHandle,
} from "./DiagnosticParcelleSvg";
import DiagnosticParcelleSvgNotice from "./DiagnosticParcelleSvgNotice";

type DiagnosticRecommendationsProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticRecommendations = ({
  diagnosticItem,
}: DiagnosticRecommendationsProps) => {
  const { cx, classes } = useStyles();

  const [
    optimalZoneSoundClassificationHelper,
    setOptimalZoneSoundClassificationHelper,
  ] = useState<SoundClassificationIntersectionAffectedHelper[]>([]);

  const svgRef = useRef<DiagnosticParcelleSvgHandle>(null);
  const lastOptimalZoneSoundClassificationHelperRef = useRef<
    SoundClassificationIntersectionAffectedHelper[]
  >([]);

  const {
    diagnostic: {
      recommendations,
      land_intersections_ld,
      air_intersections,
      soundclassification_intersections,
    },
    parcelle: { geometry },
  } = diagnosticItem;

  const uniqueSourceCodeInfraCombinations = new Set(
    land_intersections_ld.map(
      (item) => `${item.typesource}|||${item.codeinfra}`
    )
  );
  const isDiagnosticMonoSource =
    uniqueSourceCodeInfraCombinations.size + air_intersections.length === 1;

  const optimalZonePoints = svgRef.current?.optimalZonePoints;
  const projectPoint = svgRef.current?.projectPoint;
  const unprojectPoint = svgRef.current?.unprojectPoint;

  const computeSoundClassificationHelpers =
    useCallback((): SoundClassificationIntersectionAffectedHelper[] => {
      if (!optimalZonePoints || !projectPoint || !unprojectPoint) return [];

      return soundclassification_intersections.map((intersection) => ({
        intersection,
        doesAffectOptimalZone: doesOptimalZoneIntersect(
          optimalZonePoints,
          intersection.geometry_intersection,
          projectPoint
        ),
        preciseDistance: getMinDistanceToSourcePoint(
          optimalZonePoints,
          intersection.geometry_source_point,
          unprojectPoint
        ),
      }));
    }, [
      optimalZonePoints,
      projectPoint,
      unprojectPoint,
      soundclassification_intersections,
    ]);

  useEffect(() => {
    const computedSoundClassificationHelper =
      computeSoundClassificationHelpers();
    const hasChanged =
      JSON.stringify(computedSoundClassificationHelper) !==
      JSON.stringify(lastOptimalZoneSoundClassificationHelperRef.current);
    if (hasChanged) {
      lastOptimalZoneSoundClassificationHelperRef.current =
        computedSoundClassificationHelper;
      setOptimalZoneSoundClassificationHelper(
        computedSoundClassificationHelper
      );
    }
  }, [computeSoundClassificationHelpers]);

  return (
    <div>
      <div className={cx(classes.container)}>
        {!!land_intersections_ld.length && isDiagnosticMonoSource && (
          <div className={fr.cx("fr-mb-10v")}>
            <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
              Proposition d'une position de bâti
            </h4>
            <div className={cx(classes.section)}>
              <p className={fr.cx("fr-mb-0")}>
                D'après les cartes de bruit “Grandes Insfratructures de
                Transport Terrestres” et “Grandes Agglomérations”, voici une
                estimation de l'impact du bruit sur la surface de la parcelle :
              </p>
            </div>
            <div
              className={fr.cx(
                "fr-grid-row",
                "fr-grid-row--gutters",
                "fr-my-10v"
              )}
            >
              <div className={fr.cx("fr-col-lg-7")}>
                <div className={cx(classes.svgContainer)}>
                  <DiagnosticParcelleSvg
                    ref={svgRef}
                    geometry={geometry}
                    intersections={land_intersections_ld}
                  />
                </div>
              </div>
              <div className={cx(classes.notice, fr.cx("fr-col-lg-5"))}>
                <DiagnosticParcelleSvgNotice
                  intersections={land_intersections_ld}
                />
              </div>
            </div>
            <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
              Isolement
              {soundclassification_intersections.length > 1 ? "s" : ""}{" "}
              théorique
              {soundclassification_intersections.length > 1 ? "s" : ""} avec la
              position idéale du bâti selon diagBruit
            </h4>
            <div className={cx(classes.section)}>
              <DiagnosticInfrastructureNoiseTable
                intersectionsHelper={optimalZoneSoundClassificationHelper}
                color={fr.colors.decisions.border.default.purpleGlycine.default}
              />
            </div>
          </div>
        )}
        <div>
          <h4 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
            Documentation
          </h4>
          <div className={cx(classes.section)}>
            <p className={fr.cx("fr-mb-0")}>
              Des exemples de préconisations sont consultables sur les
              thématiques suivantes :
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
          {recommendations.map((recommendation, index) => (
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
                dangerouslySetInnerHTML={{ __html: recommendation.content }}
              />
              {recommendation.links.length && (
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
}));

export default DiagnosticRecommendations;
