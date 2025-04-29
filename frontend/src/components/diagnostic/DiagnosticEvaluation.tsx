import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { EVALUATION_TEXTS } from "../../utils/texts/evaluation";
import { getReadableSource, replacePlaceholders } from "../../utils/tools";
import { DiagnosticItem } from "../../utils/types";
import { Table } from "@codegouvfr/react-dsfr/Table";

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

  return (
    <div>
      <div className={cx(classes.container)}>
        <div>
          <img
            className={cx(classes.mainIcon)}
            src="/images/connection-lost.svg"
            width={80}
            height={80}
          />
        </div>
        <div className={classes.content}>
          <h2 className={fr.cx("fr-h5")}>
            2. Évaluation du risque selon DiagBruit
          </h2>
          <h3 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
            Informations sur le risque
          </h3>
          <p className={cx(classes.section, fr.cx("fr-mb-0"))}>
            {EVALUATION_TEXTS.INFORMATIONS.INTRODUCTION}
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
                              codinfra:
                                land_intersections_ld[0].codeinfra || "",
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
                      EVALUATION_TEXTS.INFORMATIONS.EXPOSURE.DAY_AND_NIGHT
                        .INFO + getMultiExposedLdenLnSpecification(),
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
                    ? EVALUATION_TEXTS.INFORMATIONS.PRIORITY_ZONE
                        .IN_PRIORITY_ZONE
                    : EVALUATION_TEXTS.INFORMATIONS.PRIORITY_ZONE
                        .NOT_IN_PRIORITY_ZONE,
                }}
              />
            </ul>
          </p>
          <h3 className={fr.cx("fr-text--lg", "fr-mb-4v", "fr-mt-8v")}>
            Cartes de bruit
          </h3>
          <p className={cx(classes.section, fr.cx("fr-mb-0"))}>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil
            mollitia voluptate consequatur placeat obcaecati. Doloribus,
            obcaecati provident, facere perspiciatis labore commodi eum,
            suscipit itaque blanditiis odio beatae. Vero, itaque nemo!
          </p>
          <div className={cx(classes.sourcesTable)}>
            {flags.isMultiExposedSources && (
              <Table
                caption="Tableau de synthèse des niveaux de bruit par source"
                noCaption
                data={land_intersections_ld.map((intersection) => [
                  getReadableSource(intersection.typesource, true),
                  intersection.codeinfra || "Non connu",
                  intersection.legende,
                ])}
                headers={[
                  "Type de source",
                  "Nom de la source",
                  "Niveau de bruit (dB)",
                ]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const useStyles = tss.withName(DiagnosticEvaluation.name).create(() => ({
  container: {
    display: "flex",
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
    "@media screen and (max-width: 768px)": {
      flexDirection: "column",
    },
  },
  mainIcon: {
    padding: fr.spacing("1v"),
  },
  section: {
    padding: `${fr.spacing("2v")} ${fr.spacing("2v")} ${fr.spacing(
      "2v"
    )} ${fr.spacing("10v")}`,
    borderLeft: `4px solid ${fr.colors.decisions.border.default.blueFrance.default}`,
  },
  content: {
    paddingTop: fr.spacing("11v"),
    "@media screen and (max-width: 768px)": {
      paddingTop: fr.spacing("2v"),
    },
  },
  sourcesTable: {
    marginTop: fr.spacing("8v"),
    display: "flex",
    justifyContent: "center",
  },
}));

export default DiagnosticEvaluation;
