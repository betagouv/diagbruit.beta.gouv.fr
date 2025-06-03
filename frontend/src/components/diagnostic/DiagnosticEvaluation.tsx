import { fr } from "@codegouvfr/react-dsfr";
import { Table } from "@codegouvfr/react-dsfr/Table";
import { tss } from "tss-react/dsfr";
import { EVALUATION_TEXTS } from "../../utils/texts/evaluation";
import {
  getReadableCardinality,
  getReadableSource,
  replacePlaceholders,
} from "../../utils/tools";
import { DiagnosticItem, LandIntersection } from "../../utils/types";
import DiagnosticScoreOnScale from "./DiagnosticScoreOnScale";

type DiagnosticEvaluationProps = {
  diagnosticItem: DiagnosticItem;
};

const DiagnosticEvaluation = ({
  diagnosticItem,
}: DiagnosticEvaluationProps) => {
  const { cx, classes } = useStyles();

  const {
    diagnostic: {
      max_db_lden,
      min_db_lden,
      land_intersections_ld,
      land_intersections_ln,
      air_intersections,
      flags,
    },
  } = diagnosticItem;

  const getDbLevelsSpecification = () => {
    const dbBuffer = 10;
    return (
      " " +
      (max_db_lden > min_db_lden + dbBuffer
        ? EVALUATION_TEXTS.INFORMATIONS.NOISE_LEVELS.LEVEL_VARIATION_HIGH
        : EVALUATION_TEXTS.INFORMATIONS.NOISE_LEVELS.LEVEL_VARIATION_LOW)
    );
  };

  const getMultiExposedLdenLnSpecification = () => {
    const dbBuffer = 10;

    const ldenDb = land_intersections_ld[0].legende;
    const lnDb = land_intersections_ln[0].legende + dbBuffer;

    if (ldenDb === lnDb) {
      return ".";
    }

    return (
      " " +
      (ldenDb > lnDb
        ? EVALUATION_TEXTS.INFORMATIONS.EXPOSURE.DAY_AND_NIGHT.NIGHT_LOWER
        : EVALUATION_TEXTS.INFORMATIONS.EXPOSURE.DAY_AND_NIGHT.DAY_LOWER)
    );
  };

  const getLnCodeInfraLegende = (codeinfra: string | null) => {
    if (!codeinfra) return "-";

    const ln_intersection = land_intersections_ln.find(
      (intersection) => intersection.codeinfra === codeinfra
    );

    return ln_intersection ? ln_intersection.legende + " dB" : "-";
  };

  const getMaxPercentImpactedFromCodeInfra = (
    landIntersections: LandIntersection[],
    codeinfra: string
  ) => {
    const intersection = landIntersections
      .filter((intersection) => intersection.codeinfra === codeinfra)
      .sort((a, b) => b.percent_impacted - a.percent_impacted)[0];

    return intersection ? intersection.percent_impacted : 0;
  };

  const getUniqueIntersectionsByCodeInfra = () => {
    const maxLegendeByInfra: { [key: string]: LandIntersection } = {};

    land_intersections_ld.forEach((entry) => {
      if (entry.cbstype === "A") {
        const key = entry.codeinfra || "null";
        if (
          !maxLegendeByInfra[key] ||
          entry.legende > maxLegendeByInfra[key].legende
        ) {
          maxLegendeByInfra[key] = entry;
        }
      }
    });

    const values = Object.values(maxLegendeByInfra);

    const filtered = values.filter((entry) => {
      if (
        values.some(
          (intersection) =>
            intersection.legende === entry.legende && !!intersection.codeinfra
        ) &&
        entry.codeinfra === null
      ) {
        return false;
      }
      return true;
    });

    return filtered.sort((a, b) => b.legende - a.legende);
  };

  const land_intersections_ld_unique_display =
    getUniqueIntersectionsByCodeInfra();

  console.log(land_intersections_ld);
  console.log(land_intersections_ld_unique_display);

  return (
    <div className={cx(classes.container)}>
      <h3 className={fr.cx("fr-text--lg", "fr-mb-4v")}>Cartes de bruit</h3>
      <div className={cx(classes.section)}>
        <p className={cx(fr.cx("fr-mb-0"))}>
          {EVALUATION_TEXTS.INFORMATIONS.INTRODUCTION}
        </p>
        <ul>
          <li
            dangerouslySetInnerHTML={{
              __html: flags.isMultiExposedDistinctTypeSources
                ? replacePlaceholders(
                    EVALUATION_TEXTS.INFORMATIONS.CHARACTERISTICS
                      .MULTI_EXPOSURE,
                    {
                      sources: Array.from(
                        new Set(
                          land_intersections_ld.map(
                            (intersection) =>
                              `<b>${getReadableSource(
                                intersection.typesource
                              )}</b>`
                          )
                        )
                      ).join(" et "),
                    }
                  )
                : EVALUATION_TEXTS.INFORMATIONS.CHARACTERISTICS
                    .NO_MULTI_EXPOSURE,
            }}
          />
          {!!land_intersections_ld[0] && (
            <li
              dangerouslySetInnerHTML={{
                __html:
                  land_intersections_ld[0].typeterr === "INFRA"
                    ? replacePlaceholders(
                        EVALUATION_TEXTS.INFORMATIONS.CHARACTERISTICS
                          .MAIN_SOURCE_INFRA,
                        {
                          typesource: getReadableSource(
                            land_intersections_ld[0].typesource
                          ),
                          codinfra: land_intersections_ld[0].codeinfra || "",
                          percent_impacted: Math.round(
                            getMaxPercentImpactedFromCodeInfra(
                              land_intersections_ld,
                              land_intersections_ld[0].codeinfra || ""
                            ) * 100
                          ),
                          direction: getReadableCardinality(
                            land_intersections_ld[0].direction
                          ),
                        }
                      )
                    : EVALUATION_TEXTS.INFORMATIONS.CHARACTERISTICS
                        .MAIN_SOURCE_AGGLO,
              }}
            />
          )}
          {flags.isMultiExposedLdenLn && (
            <li
              dangerouslySetInnerHTML={{
                __html:
                  EVALUATION_TEXTS.INFORMATIONS.EXPOSURE.DAY_AND_NIGHT.INFO +
                  getMultiExposedLdenLnSpecification(),
              }}
            />
          )}
          <li
            dangerouslySetInnerHTML={{
              __html:
                replacePlaceholders(
                  EVALUATION_TEXTS.INFORMATIONS.NOISE_LEVELS.LEVEL_INFO,
                  {
                    levelMax: max_db_lden,
                    levelMin: min_db_lden,
                  }
                ) + getDbLevelsSpecification(),
            }}
          />
          <li
            dangerouslySetInnerHTML={{
              __html: flags.isPriorityZone
                ? EVALUATION_TEXTS.INFORMATIONS.PRIORITY_ZONE.IN_PRIORITY_ZONE
                : EVALUATION_TEXTS.INFORMATIONS.PRIORITY_ZONE
                    .NOT_IN_PRIORITY_ZONE,
            }}
          />
        </ul>
      </div>
      <div className={cx(classes.sourcesTable)}>
        {(!!land_intersections_ld_unique_display.length ||
          !!air_intersections.length) && (
          <Table
            caption="Tableau de synthèse des niveaux de bruit par source"
            noCaption
            data={land_intersections_ld_unique_display
              .filter((intersection) => intersection.cbstype === "A")
              .map((intersection) => [
                getReadableSource(intersection.typesource, true),
                intersection.codeinfra || "Non connu",
                intersection.legende + " dB",
                getLnCodeInfraLegende(intersection.codeinfra),
              ])
              .concat(
                air_intersections.map((intersection) => [
                  "Aérien",
                  intersection.nom || "Non connu",
                  intersection.legende + " dB",
                  "-",
                ])
              )}
            headers={[
              "Type de source",
              "Nom de la source",
              "Niveau de bruit (jour)",
              "Niveau de bruit (nuit)",
            ]}
          />
        )}
      </div>
    </div>
  );
};

const useStyles = tss.create(() => ({
  container: {
    ul: {
      marginTop: fr.spacing("4v"),
      marginLeft: fr.spacing("4v"),
      li: {
        lineHeight: "1.75rem",
        "&:not(:last-child)": {
          marginBottom: fr.spacing("2v"),
        },
      },
    },
    paddingTop: fr.spacing("11v"),
    [fr.breakpoints.down("md")]: {
      paddingTop: fr.spacing("2v"),
    },
  },
  section: {
    padding: `${fr.spacing("2v")} ${fr.spacing("2v")} ${fr.spacing(
      "2v"
    )} ${fr.spacing("10v")}`,
    marginLeft: fr.spacing("6v"),
    borderLeft: `4px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
    ul: {
      marginBottom: 0,
    },
  },
  sourcesTable: {
    marginTop: fr.spacing("8v"),
    display: "flex",
    justifyContent: "center",
  },
}));

export default DiagnosticEvaluation;
